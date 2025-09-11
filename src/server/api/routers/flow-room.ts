import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { flowRedisManager } from '@/lib/redis'

// Define Zod schemas based on our custom React Flow types
const customNodeDataSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
}).passthrough() // Allow additional properties for extensibility

const customNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: customNodeDataSchema,
}).passthrough() // Allow additional React Flow properties

const customEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
}).passthrough() // Allow additional React Flow properties

const flowDataSchema = z.object({
  nodes: z.array(customNodeSchema),
  edges: z.array(customEdgeSchema),
  // Note: viewport is not included as it's local to each user
})

export const flowRoomRouter = createTRPCRouter({
  // Create a new flow room
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      isPublic: z.boolean().default(false),
      initialFlowData: flowDataSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.flowRoom.create({
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          ownerId: ctx.session.user.id,
          flowData: (input.initialFlowData || { nodes: [], edges: [] }) as any,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      // Cache the room data in Redis for immediate availability
      try {
        await flowRedisManager.cacheFlowRoom(room.id, {
          roomId: room.id,
          ownerId: room.ownerId,
          flowData: {
            nodes: [],
            edges: [],
            ...(room.flowData as Record<string, unknown> || {})
          },
          lastSyncedAt: new Date().toISOString(),
        })
        // eslint-disable-next-line no-console
        console.log(`Cached new room ${room.id} in Redis`)
      } catch (error) {
        console.warn('Failed to cache room in Redis:', error)
        // Don't fail the room creation if Redis caching fails
      }

      return room
    }),

  // Get room by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Flow room not found',
        })
      }

      // Check if user has access to this room
      const userId = ctx.session?.user?.id
      const hasAccess = room.isPublic ||
        room.ownerId === userId ||
        room.participants.some(p => p.userId === userId)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this room',
        })
      }

      return room
    }),

  // Get user's rooms
  getUserRooms: protectedProcedure
    .query(async ({ ctx }) => {
      const rooms = await ctx.db.flowRoom.findMany({
        where: {
          OR: [
            { ownerId: ctx.session.user.id },
            { participants: { some: { userId: ctx.session.user.id } } },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      return rooms
    }),

  // Get public rooms for discovery
  getPublicRooms: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { search, limit, cursor } = input

      const rooms = await ctx.db.flowRoom.findMany({
        where: {
          isPublic: true,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      })

      let nextCursor: string | undefined = undefined
      if (rooms.length > limit) {
        const nextItem = rooms.pop()
        nextCursor = nextItem!.id
      }

      return {
        rooms,
        nextCursor,
      }
    }),

  // Search users for invitations
  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      roomId: z.string(),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { query, roomId, limit } = input

      // Check if user has permission to invite (must be room owner)
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: roomId },
        select: { ownerId: true },
      })

      if (!room || room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only room owners can search for users to invite',
        })
      }

      // Get existing participants and pending invitations to exclude them
      const [participants, pendingInvitations] = await Promise.all([
        ctx.db.flowRoomParticipant.findMany({
          where: { roomId },
          select: { userId: true },
        }),
        ctx.db.flowRoomInvitation.findMany({
          where: {
            roomId,
            status: 'PENDING',
          },
          select: { inviteeId: true, email: true },
        }),
      ])

      const excludeUserIds = [
        room.ownerId,
        ...participants.map(p => p.userId),
        ...pendingInvitations.map(i => i.inviteeId).filter((id): id is string => id !== null),
      ]

      const excludeEmails = pendingInvitations.map(i => i.email).filter((email): email is string => email !== null)

      // Search users
      const users = await ctx.db.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
            { id: { notIn: excludeUserIds } },
            ...(excludeEmails.length > 0 ? [{ email: { notIn: excludeEmails } }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: limit,
      })

      return users
    }),

  // Update room flow data
  updateFlowData: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      flowData: flowDataSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has edit access
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: input.roomId },
        include: {
          participants: {
            where: { userId: ctx.session.user.id },
          },
        },
      })

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Flow room not found',
        })
      }

      const isOwner = room.ownerId === ctx.session.user.id
      const isEditor = room.participants.some(p =>
        p.userId === ctx.session.user.id && p.role === 'EDITOR'
      )

      if (!isOwner && !isEditor) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have edit access to this room',
        })
      }

      // Update database
      const updatedRoom = await ctx.db.flowRoom.update({
        where: { id: input.roomId },
        data: {
          flowData: input.flowData as any,
          updatedAt: new Date(),
        },
      })

      // Update Redis cache (optional - can be implemented later)
      // await flowRedisManager.cacheFlowRoom(input.roomId, {
      //   roomId: input.roomId,
      //   ownerId: room.ownerId,
      //   flowData: input.flowData,
      //   lastSyncedAt: new Date().toISOString(),
      // })

      return updatedRoom
    }),

  // Add participant to room
  addParticipant: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      userId: z.string(),
      role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if current user is owner
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: input.roomId },
      })

      if (!room || room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only room owners can add participants',
        })
      }

      // Add participant
      const participant = await ctx.db.flowRoomParticipant.create({
        data: {
          roomId: input.roomId,
          userId: input.userId,
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      return participant
    }),

  // Create room invitation
  createInvitation: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      userId: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { roomId, userId, email, role, message } = input

      if (!userId && !email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either userId or email must be provided',
        })
      }

      // Check if current user is room owner
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: roomId },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      if (!room || room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only room owners can send invitations',
        })
      }

      // If userId provided, check if user exists and get their email
      let targetUser = null
      let targetEmail = email

      if (userId) {
        targetUser = await ctx.db.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        })

        if (!targetUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        targetEmail = targetUser.email || undefined
      }

      // Check if user is already a participant
      if (userId) {
        const existingParticipant = await ctx.db.flowRoomParticipant.findUnique({
          where: {
            roomId_userId: {
              roomId,
              userId,
            },
          },
        })

        if (existingParticipant) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a participant in this room',
          })
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await ctx.db.flowRoomInvitation.findFirst({
        where: {
          roomId,
          status: 'PENDING',
          ...(userId ? { inviteeId: userId } : { email: targetEmail }),
        },
      })

      if (existingInvitation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A pending invitation already exists for this user',
        })
      }

      // Create invitation
      const invitation = await ctx.db.flowRoomInvitation.create({
        data: {
          roomId,
          inviterId: ctx.session.user.id,
          inviteeId: userId,
          email: targetEmail,
          role,
          message,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invitee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // TODO: Send email notification here
      // await sendInvitationEmail(invitation)

      return invitation
    }),

  // Accept room invitation
  acceptInvitation: protectedProcedure
    .input(z.object({
      invitationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.flowRoomInvitation.findUnique({
        where: { id: input.invitationId },
        include: {
          room: true,
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if invitation is for current user
      const isForCurrentUser = invitation.inviteeId === ctx.session.user.id ||
        invitation.email === ctx.session.user.email

      if (!isForCurrentUser) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is not for you',
        })
      }

      // Check if invitation is still valid
      if (invitation.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation is no longer valid',
        })
      }

      if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        // Mark as expired
        await ctx.db.flowRoomInvitation.update({
          where: { id: input.invitationId },
          data: { status: 'EXPIRED' },
        })

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired',
        })
      }

      // Check if user is already a participant
      const existingParticipant = await ctx.db.flowRoomParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId: invitation.roomId,
            userId: ctx.session.user.id,
          },
        },
      })

      if (existingParticipant) {
        // Mark invitation as accepted but don't create duplicate participant
        await ctx.db.flowRoomInvitation.update({
          where: { id: input.invitationId },
          data: { status: 'ACCEPTED' },
        })

        return { success: true, message: 'You are already a participant in this room' }
      }

      // Create participant and mark invitation as accepted
      await ctx.db.$transaction([
        ctx.db.flowRoomParticipant.create({
          data: {
            roomId: invitation.roomId,
            userId: ctx.session.user.id,
            role: invitation.role,
          },
        }),
        ctx.db.flowRoomInvitation.update({
          where: { id: input.invitationId },
          data: { status: 'ACCEPTED' },
        }),
      ])

      return { success: true, roomId: invitation.roomId }
    }),

  // Decline room invitation
  declineInvitation: protectedProcedure
    .input(z.object({
      invitationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.flowRoomInvitation.findUnique({
        where: { id: input.invitationId },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if invitation is for current user
      const isForCurrentUser = invitation.inviteeId === ctx.session.user.id ||
        invitation.email === ctx.session.user.email

      if (!isForCurrentUser) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is not for you',
        })
      }

      // Mark invitation as declined
      await ctx.db.flowRoomInvitation.update({
        where: { id: input.invitationId },
        data: { status: 'DECLINED' },
      })

      return { success: true }
    }),

  // Get user's invitations
  getUserInvitations: protectedProcedure
    .query(async ({ ctx }) => {
      const invitations = await ctx.db.flowRoomInvitation.findMany({
        where: {
          AND: [
            {
              OR: [
                { inviteeId: ctx.session.user.id },
                { email: ctx.session.user.email },
              ],
            },
            { status: 'PENDING' },
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          ],
        },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return invitations
    }),

  // Join public room
  joinPublicRoom: protectedProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: input.roomId },
      })

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found',
        })
      }

      if (!room.isPublic) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This room is not public',
        })
      }

      // Check if user is already a participant
      const existingParticipant = await ctx.db.flowRoomParticipant.findUnique({
        where: {
          roomId_userId: {
            roomId: input.roomId,
            userId: ctx.session.user.id,
          },
        },
      })

      if (existingParticipant) {
        return { success: true, message: 'You are already a participant in this room' }
      }

      // Check if user is the owner
      if (room.ownerId === ctx.session.user.id) {
        return { success: true, message: 'You are the owner of this room' }
      }

      // Add user as participant
      await ctx.db.flowRoomParticipant.create({
        data: {
          roomId: input.roomId,
          userId: ctx.session.user.id,
          role: 'VIEWER', // Default role for public room joins
        },
      })

      return { success: true }
    }),

  // Remove participant from room
  removeParticipant: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if current user is owner or removing themselves
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: input.roomId },
      })

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Flow room not found',
        })
      }

      const isOwner = room.ownerId === ctx.session.user.id
      const isRemovingSelf = input.userId === ctx.session.user.id

      if (!isOwner && !isRemovingSelf) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only remove yourself or be the room owner',
        })
      }

      // Remove participant
      await ctx.db.flowRoomParticipant.delete({
        where: {
          roomId_userId: {
            roomId: input.roomId,
            userId: input.userId,
          },
        },
      })

      return { success: true }
    }),

  // Update room settings
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Check if user is owner
      const room = await ctx.db.flowRoom.findUnique({
        where: { id },
      })

      if (!room || room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only room owners can update room settings',
        })
      }

      // Update room
      const updatedRoom = await ctx.db.flowRoom.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      })

      return updatedRoom
    }),

  // Delete room
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const room = await ctx.db.flowRoom.findUnique({
        where: { id: input.id },
      })

      if (!room || room.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only room owners can delete rooms',
        })
      }

      // Delete from database (participants will be cascade deleted)
      await ctx.db.flowRoom.delete({
        where: { id: input.id },
      })

      // Clean up Redis cache (optional - can be implemented later)
      // await flowRedisManager.cleanupRoom(input.id)

      return { success: true }
    }),
})