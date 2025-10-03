# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Ready

- [ ] Redis Cloud credentials (REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, REDIS_DB)
- [ ] Supabase database URLs (DATABASE_URL, DIRECT_URL)
- [ ] Supabase storage credentials (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] NextAuth secret (NEXTAUTH_SECRET - generate new for production!)
- [ ] OAuth credentials (optional: DISCORD, GOOGLE)

### 2. Code Ready

- [ ] All changes committed to GitHub
- [ ] `railway.json` file exists in root
- [ ] `package.json` has correct Node.js engine (>=18.17.0) ✅
- [ ] No hardcoded localhost URLs in code

### 3. External Services Configured

- [ ] Redis Cloud instance is running and accessible
- [ ] Supabase database is accessible
- [ ] Supabase storage bucket created for file uploads

---

## 🏗️ Railway Deployment Steps

### Step 1: Create Railway Project (5 minutes)

1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `nextjs-boilerplace` repository
6. Railway will auto-detect Next.js

### Step 2: Add Environment Variables (10 minutes)

In Railway project settings → Variables, add:

```env
# Database
DATABASE_URL=postgresql://postgres:xxx@xxx.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&pool_timeout=30
DIRECT_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres?connect_timeout=30

# Auth (IMPORTANT: Generate new secret!)
NEXTAUTH_SECRET=<generate-new-secret-here>
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Redis Cloud
REDIS_HOST=xxx.redns.redis-cloud.com
REDIS_PORT=xxxxx
REDIS_USERNAME=default
REDIS_PASSWORD=xxxxx
REDIS_DB=xxx

# Supabase Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# WebSocket (Railway auto-provides domain)
NEXT_PUBLIC_WS_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Optional: OAuth
DISCORD_CLIENT_ID=xxxxx
DISCORD_CLIENT_SECRET=xxxxx
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

# Node Environment
NODE_ENV=production
```

**💡 Tip:** Railway provides `${{RAILWAY_PUBLIC_DOMAIN}}` variable that auto-updates with your domain!

### Step 3: Generate New NEXTAUTH_SECRET

```bash
# Run this command to generate a secure secret:
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET`

### Step 4: Deploy (Automatic)

Railway will automatically:

1. ✅ Install dependencies
2. ✅ Run `prisma generate` (from postinstall script)
3. ✅ Build Next.js app
4. ✅ Start the server

Watch the deployment logs in Railway dashboard.

### Step 5: Run Database Migrations (First time only)

After first successful deployment:

**Option A: Using Railway Dashboard**

1. Go to your Railway project
2. Click on your service
3. Go to "Settings" → "Deploy"
4. Add one-time command: `npm run db:migrate`

**Option B: Using Railway CLI**

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

### Step 6: Update OAuth Callback URLs (If using OAuth)

**Discord:**

- Go to Discord Developer Portal
- Add callback URL: `https://your-app.railway.app/api/auth/callback/discord`

**Google:**

- Go to Google Cloud Console
- Add authorized redirect URI: `https://your-app.railway.app/api/auth/callback/google`

### Step 7: Test Your Deployment

1. **Visit your app:** `https://your-app.railway.app`
2. **Test authentication:** Try logging in
3. **Test WebSocket:** Open browser console and check for WebSocket connection
4. **Test React Flow:** Create a new flow room and test real-time collaboration
5. **Test file upload:** Upload a file to verify Supabase storage works

---

## 🧪 Testing WebSocket Connection

Open browser console on your deployed app:

```javascript
// Check if WebSocket is connected
const socket = io(window.location.origin)

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id)
})

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected')
})

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error)
})
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Fails - "Prisma Client not generated"

**Solution:** Railway should run `postinstall` automatically. If not, add to `railway.json`:

```json
{
  "build": {
    "buildCommand": "npm install && npx prisma generate && npm run build"
  }
}
```

### Issue 2: WebSocket Connection Fails

**Checklist:**

- [ ] `NEXT_PUBLIC_WS_URL` is set to Railway domain
- [ ] No CORS errors in browser console
- [ ] Railway service is running (check dashboard)
- [ ] Check Railway logs for WebSocket errors

### Issue 3: Redis Connection Fails

**Checklist:**

- [ ] Redis Cloud credentials are correct
- [ ] Redis Cloud allows connections from any IP (or Railway IPs)
- [ ] Test connection: Railway logs should show "Redis connected successfully"

### Issue 4: Database Connection Fails

**Checklist:**

- [ ] `DATABASE_URL` uses port 6543 (pgBouncer)
- [ ] `DIRECT_URL` uses port 5432 (direct)
- [ ] Supabase allows connections from Railway
- [ ] Connection string includes `connect_timeout=30`

### Issue 5: File Upload Fails

**Checklist:**

- [ ] Supabase storage bucket exists
- [ ] Bucket has correct RLS policies
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is correct
- [ ] Check Railway logs for Supabase errors

---

## 📊 Post-Deployment Monitoring

### Check Railway Logs

```bash
# Using Railway CLI
railway logs
```

### Check Application Health

- Visit: `https://your-app.railway.app/api/health` (if you have health endpoint)
- Check Railway metrics: CPU, Memory, Network

### Check Database Logs

```sql
-- Check recent audit logs
SELECT * FROM "AuditLog"
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Check WebSocket events
SELECT * FROM "AuditLog"
WHERE category = 'collaboration'
ORDER BY timestamp DESC
LIMIT 50;
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ App loads at Railway URL
- ✅ Authentication works (login/logout)
- ✅ WebSocket connects (check browser console)
- ✅ React Flow rooms can be created
- ✅ Real-time collaboration works (test with 2 browser tabs)
- ✅ File upload/download works
- ✅ Calendar events can be created
- ✅ No errors in Railway logs

---

## 💰 Cost Tracking

### Railway Free Tier

- **$5/month credit** (automatically applied)
- Resets monthly
- Suitable for development and small projects

### Monitor Usage

- Check Railway dashboard for usage metrics
- Set up billing alerts
- Upgrade plan when needed

### External Services (Already Free)

- ✅ Redis Cloud: Free tier (30MB)
- ✅ Supabase: Free tier (500MB DB, 1GB storage)

**Total Cost: $0-5/month** for small projects

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit and push to GitHub
3. Railway detects changes
4. Automatic deployment starts
5. Check deployment logs
6. Test the new deployment

**💡 Tip:** Set up branch deployments for staging environment!

---

## 📞 Support Resources

- **Railway Discord:** https://discord.gg/railway
- **Railway Docs:** https://docs.railway.app
- **Your App Logs:** Railway Dashboard → Your Project → Logs
- **Supabase Support:** https://supabase.com/support
- **Redis Cloud Support:** https://redis.io/support

---

## 🎯 Next Steps After Deployment

1. [ ] Set up custom domain (optional)
2. [ ] Configure CDN for static assets
3. [ ] Set up monitoring/alerting
4. [ ] Create staging environment
5. [ ] Set up automated backups
6. [ ] Document deployment process for team
7. [ ] Set up error tracking (Sentry, etc.)

---

**🚀 Ready to deploy? Follow the steps above and you'll be live in ~30 minutes!**
