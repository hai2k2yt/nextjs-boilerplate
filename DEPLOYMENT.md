# Deployment Guide

This application uses **Railway** for deployment with external Redis Cloud and Supabase services.

## 🏗️ Architecture

```
Railway:
└── Next.js App + Socket.IO WebSocket Server

External Services:
├── Redis Cloud (Real-time state management)
├── Supabase PostgreSQL (Database)
└── Supabase Storage (File storage)
```

## 🚀 Deploy to Railway

### Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Redis Cloud instance (already configured)
- Supabase project (already configured)

### Step 1: Connect GitHub Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect Next.js and start deployment

### Step 2: Configure Environment Variables

Add all environment variables from your `.env` file:

#### Required Variables:

**Database (Supabase):**

```env
DATABASE_URL=postgresql://postgres:your-password@your-supabase-host:6543/postgres?pgbouncer=true&connect_timeout=30&pool_timeout=30
DIRECT_URL=postgresql://postgres:your-password@your-supabase-host:5432/postgres?connect_timeout=30
```

**Authentication:**

```env
NEXTAUTH_SECRET=your-secret-here-change-this-in-production
NEXTAUTH_URL=https://your-app.railway.app
```

**Redis Cloud:**

```env
REDIS_HOST=your-redis-host.redns.redis-cloud.com
REDIS_PORT=your-redis-port
REDIS_USERNAME=your-redis-username
REDIS_PASSWORD=your-redis-password
REDIS_DB=your-database-name
```

**Supabase Storage:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**WebSocket (Optional):**

```env
NEXT_PUBLIC_WS_URL=https://your-app.railway.app
```

**OAuth (Optional):**

```env
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3: Configure Domain

1. Railway provides a default domain: `your-app.railway.app`
2. Update `NEXTAUTH_URL` to match your Railway domain
3. Update `NEXT_PUBLIC_WS_URL` to match your Railway domain
4. (Optional) Add custom domain in Railway settings

### Step 4: Deploy

Railway will automatically:

1. Install dependencies
2. Run Prisma generate
3. Build Next.js app
4. Start the server

### Step 5: Run Database Migrations

After first deployment, run migrations:

1. Go to Railway project settings
2. Open the deployment logs
3. Or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:migrate
```

## 🔧 Alternative Deployment Options

### Option 1: Render.com (Free with limitations)

**Pros:**

- Free tier available
- WebSocket support

**Cons:**

- ⚠️ **Cold starts after 15 min inactivity**
- ⚠️ WebSocket connections will disconnect
- Not ideal for real-time collaboration

**Setup:**

1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: nextjs-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
```

### Option 2: Fly.io (Good alternative)

**Pros:**

- Excellent WebSocket support
- No cold starts
- Free tier available

**Cons:**

- Requires credit card
- CLI-based deployment

**Setup:**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

### ❌ NOT Recommended: Vercel/Netlify

**Why not:**

- Serverless architecture incompatible with persistent WebSocket connections
- Socket.IO won't work properly
- Connections timeout after 10-60 seconds

## 🧪 Testing WebSocket Connection

After deployment, test your WebSocket connection:

```javascript
// Open browser console on your deployed app
const socket = io(window.location.origin)

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id)
})

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected')
})
```

## 📊 Monitoring

### Railway Monitoring

- View logs in Railway dashboard
- Monitor CPU/Memory usage
- Check deployment status

### Application Monitoring

- Check audit logs in database:

```sql
SELECT * FROM "AuditLog"
WHERE category = 'collaboration'
ORDER BY timestamp DESC
LIMIT 100;
```

## 🐛 Troubleshooting

### WebSocket Connection Issues

**Problem:** WebSocket fails to connect

**Solutions:**

1. Check `NEXT_PUBLIC_WS_URL` is set correctly
2. Verify Railway domain is correct
3. Check browser console for errors
4. Ensure Redis Cloud is accessible from Railway

### Redis Connection Issues

**Problem:** Redis connection fails

**Solutions:**

1. Verify Redis Cloud credentials
2. Check Redis Cloud allows connections from Railway IPs
3. Test Redis connection:

```bash
railway run node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log);"
```

### Database Connection Issues

**Problem:** Database connection fails

**Solutions:**

1. Verify Supabase connection string
2. Check Supabase allows connections from Railway
3. Ensure `DATABASE_URL` uses port 6543 (pgBouncer)
4. Ensure `DIRECT_URL` uses port 5432 (direct connection)

### Build Failures

**Problem:** Build fails on Railway

**Solutions:**

1. Check Node.js version matches `package.json` engines
2. Verify all dependencies are in `package.json`
3. Check build logs for specific errors
4. Ensure Prisma generates correctly

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `NEXTAUTH_SECRET` to a strong random string
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Verify Redis Cloud has password authentication
- [ ] Check Supabase RLS policies are enabled
- [ ] Review OAuth callback URLs
- [ ] Enable HTTPS (Railway provides this automatically)
- [ ] Set up proper CORS configuration
- [ ] Review environment variables for sensitive data

## 💰 Cost Estimation

### Railway Free Tier

- $5/month credit
- Suitable for small-medium traffic
- ~500-1000 concurrent users

### After Free Tier (~$10-20/month)

- Railway: $5-10/month
- Redis Cloud: Free tier (30MB)
- Supabase: Free tier (500MB database, 1GB storage)

**Total: $5-10/month** for small-medium projects

## 📈 Scaling Considerations

When you need to scale:

1. **Upgrade Railway plan** for more resources
2. **Upgrade Redis Cloud** for more memory/connections
3. **Upgrade Supabase** for more database storage
4. **Add CDN** (Cloudflare) for static assets
5. **Consider horizontal scaling** with multiple Railway instances

## 🔄 CI/CD

Railway automatically deploys on every push to main branch.

To customize:

1. Go to Railway project settings
2. Configure deployment triggers
3. Set up preview environments for PRs

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Supabase Documentation](https://supabase.com/docs)
- [Redis Cloud Documentation](https://redis.io/docs/cloud/)
