import { db } from '@/server/db'

async function main() {
  const post = await db.post.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Hello World',
    },
  })
  console.log({ post })
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
