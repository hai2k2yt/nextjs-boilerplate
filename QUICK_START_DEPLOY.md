# ⚡ Quick Start - Deploy in 15 Minutes

This is the fastest path to deploy your app to Railway.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [x] Redis Cloud instance running (you have this ✅)
- [x] Supabase database configured (you have this ✅)
- [x] Supabase storage bucket created (you have this ✅)
- [ ] GitHub account
- [ ] Railway account (sign up at https://railway.app)
- [ ] All environment variables from your `.env` file

---

## 🚀 Deploy Steps

### Step 1: Sign Up for Railway (2 minutes)

1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with GitHub
4. Authorize Railway to access your repositories

---

### Step 2: Create New Project (1 minute)

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `nextjs-boilerplace` repository
4. Railway will automatically detect Next.js and start building

---

### Step 3: Add Environment Variables (5 minutes)

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"Add Variable"** or **"Raw Editor"**
4. Copy and paste these variables (update with your values):

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&pool_timeout=30
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.supabase.co:5432/postgres?connect_timeout=30

# Auth - IMPORTANT: Generate new secret!
NEXTAUTH_SECRET=GENERATE_NEW_SECRET_HERE
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Redis Cloud
REDIS_HOST=your-redis-host.redns.redis-cloud.com
REDIS_PORT=your-redis-port
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_DB=your-database-name

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# WebSocket
NEXT_PUBLIC_WS_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Node Environment
NODE_ENV=production
```

**💡 Important Notes:**

- Replace `YOUR_PASSWORD`, `YOUR_PROJECT`, etc. with your actual values
- `${{RAILWAY_PUBLIC_DOMAIN}}` is a Railway variable - keep it as-is!
- Generate a new `NEXTAUTH_SECRET` (see below)

---

### Step 4: Generate NEXTAUTH_SECRET (1 minute)

**Option A: Using OpenSSL (Mac/Linux)**

```bash
openssl rand -base64 32
```

**Option B: Using Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Online Generator**
Go to: https://generate-secret.vercel.app/32

Copy the generated secret and use it as `NEXTAUTH_SECRET`

---

### Step 5: Wait for Deployment (3-5 minutes)

Railway will automatically:

1. ✅ Install dependencies
2. ✅ Run `prisma generate`
3. ✅ Build Next.js app
4. ✅ Start the server

Watch the deployment logs in Railway dashboard.

---

### Step 6: Run Database Migrations (2 minutes)

After first successful deployment:

**Option A: Using Railway Dashboard**

1. Go to your Railway project
2. Click on your service
3. Go to **"Settings"** → **"Deploy"**
4. Under "Custom Start Command", temporarily add: `npm run db:migrate`
5. Click **"Deploy"**
6. After migration completes, remove the custom command and redeploy

**Option B: Using Railway CLI (Recommended)**

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

---

### Step 7: Test Your Deployment (2 minutes)

1. **Get your Railway URL:**

   - Go to Railway dashboard
   - Click on your service
   - Copy the URL (e.g., `https://your-app.railway.app`)

2. **Open in browser:**

   - Visit your Railway URL
   - You should see your app!

3. **Test WebSocket:**

   - Open browser console (F12)
   - Look for: `"WebSocket connected"`
   - Should see no errors

4. **Test login:**
   - Try creating an account or logging in
   - Should work without issues

---

## ✅ Success Checklist

Your deployment is successful when:

- [ ] App loads at Railway URL
- [ ] No errors in browser console
- [ ] Can create account / login
- [ ] WebSocket shows "connected" in console
- [ ] Can create a React Flow room
- [ ] Real-time collaboration works (test with 2 tabs)

---

## 🐛 Quick Troubleshooting

### Issue: Build Failed

**Check:**

- Railway logs for specific error
- All dependencies in `package.json`
- Node.js version compatibility

**Fix:**

- Check Railway logs
- Clear build cache in Railway settings
- Redeploy

---

### Issue: WebSocket Not Connecting

**Check:**

- `NEXT_PUBLIC_WS_URL` is set correctly
- Browser console for errors
- Railway service is running

**Fix:**

```env
# Make sure this is set:
NEXT_PUBLIC_WS_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

---

### Issue: Redis Connection Failed

**Check:**

- Redis Cloud credentials are correct
- Redis Cloud instance is running
- Railway logs for connection errors

**Fix:**

- Verify all Redis environment variables
- Test Redis connection in Railway logs
- Check Redis Cloud dashboard

---

### Issue: Database Connection Failed

**Check:**

- `DATABASE_URL` uses port 6543 (pgBouncer)
- `DIRECT_URL` uses port 5432 (direct)
- Supabase database is running

**Fix:**

```env
# Correct format:
DATABASE_URL=postgresql://postgres:PASSWORD@PROJECT.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&pool_timeout=30
DIRECT_URL=postgresql://postgres:PASSWORD@PROJECT.supabase.co:5432/postgres?connect_timeout=30
```

---

## 🎯 Next Steps

### 1. Update OAuth Callback URLs (If using OAuth)

**Discord:**

1. Go to Discord Developer Portal
2. OAuth2 → Redirects
3. Add: `https://your-app.railway.app/api/auth/callback/discord`

**Google:**

1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Add authorized redirect URI: `https://your-app.railway.app/api/auth/callback/google`

---

### 2. Set Up Custom Domain (Optional)

1. Buy domain from Namecheap/GoDaddy
2. In Railway:
   - Go to Settings → Domains
   - Click "Add Domain"
   - Follow DNS setup instructions
3. Update environment variables:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_WS_URL=https://yourdomain.com
   ```

---

### 3. Enable Automatic Deployments

Railway automatically deploys on every push to main branch!

To customize:

1. Go to Settings → Deploys
2. Configure branch and deployment triggers
3. Set up preview environments for PRs

---

## 📊 Monitor Your Deployment

### Railway Dashboard

- **Logs:** View real-time logs
- **Metrics:** CPU, Memory, Network usage
- **Deployments:** History and status

### Check Application Health

**WebSocket Connection:**

```javascript
// Open browser console
const socket = io(window.location.origin)
socket.on('connect', () => console.log('✅ Connected:', socket.id))
socket.on('disconnect', () => console.log('❌ Disconnected'))
```

**Database Logs:**

```sql
-- Check recent activity
SELECT * FROM "AuditLog"
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

---

## 💰 Cost Tracking

### Free Tier Usage

- Railway provides $5/month credit
- Monitor usage in Railway dashboard
- Set up billing alerts

### When to Upgrade

- Free credit runs out
- Need more resources (CPU/Memory)
- Higher traffic volume

**Typical costs after free tier:** $5-10/month

---

## 📚 Additional Resources

### Documentation

- 📋 [Full Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- 📊 [Platform Comparison](./CLOUD_PLATFORM_COMPARISON.md)
- 🔧 [Troubleshooting Guide](./TROUBLESHOOTING.md)
- 📖 [Complete Deployment Guide](./DEPLOYMENT.md)

### Support

- **Railway Discord:** https://discord.gg/railway
- **Railway Docs:** https://docs.railway.app
- **Railway Status:** https://status.railway.app

---

## 🎉 Congratulations!

You've successfully deployed your Next.js + React Flow + WebSocket application!

**What you've accomplished:**
✅ Deployed to Railway  
✅ Connected to Redis Cloud  
✅ Connected to Supabase  
✅ WebSocket real-time collaboration working  
✅ File uploads working  
✅ Authentication working

**Your app is now live and accessible to the world! 🚀**

---

## 🔄 Making Updates

To deploy updates:

1. Make changes locally
2. Commit to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Railway automatically deploys!
4. Check deployment logs
5. Test the changes

**That's it! Continuous deployment is set up automatically.**

---

**Need help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or ask in Railway Discord!
