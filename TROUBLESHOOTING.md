# 🔧 Deployment Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Build Failures

#### Issue: "Prisma Client not generated"

**Error Message:**

```
Error: @prisma/client did not initialize yet.
Please run "prisma generate" and try to import it again.
```

**Solution:**
The `postinstall` script should handle this automatically. If it doesn't:

1. Update `railway.json`:

```json
{
  "build": {
    "buildCommand": "npm install && npx prisma generate && npm run build"
  }
}
```

2. Or add to `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

---

#### Issue: "Module not found" errors

**Error Message:**

```
Module not found: Can't resolve 'xyz'
```

**Solutions:**

1. Ensure all dependencies are in `package.json` (not devDependencies)
2. Clear Railway cache and redeploy
3. Check for case-sensitive import issues
4. Verify Node.js version matches your local environment

---

#### Issue: TypeScript build errors

**Error Message:**

```
Type error: Cannot find module 'xyz' or its corresponding type declarations
```

**Solutions:**

1. Ensure all `@types/*` packages are installed
2. Run `npm install` locally to verify
3. Check `tsconfig.json` is committed to repo
4. Verify all TypeScript files compile locally

---

### 2. WebSocket Connection Issues

#### Issue: WebSocket fails to connect

**Symptoms:**

- Browser console shows: `WebSocket connection failed`
- Socket.IO shows: `Transport error`
- Real-time features don't work

**Debug Steps:**

1. **Check browser console:**

```javascript
// Open browser console and check for errors
console.log('WebSocket URL:', process.env.NEXT_PUBLIC_WS_URL)
```

2. **Verify environment variable:**

```env
# Should be set to your Railway domain
NEXT_PUBLIC_WS_URL=https://your-app.railway.app
```

3. **Check Railway logs:**

```bash
railway logs
# Look for: "WebSocket server started successfully"
```

4. **Test WebSocket endpoint:**

```javascript
// In browser console
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
})

socket.on('connect', () => console.log('✅ Connected'))
socket.on('connect_error', (err) => console.error('❌ Error:', err))
```

**Common Causes:**

- ❌ `NEXT_PUBLIC_WS_URL` not set or incorrect
- ❌ CORS configuration blocking connections
- ❌ Railway service not running
- ❌ WebSocket server initialization failed

**Solutions:**

1. Set `NEXT_PUBLIC_WS_URL` to Railway domain
2. Check CORS settings in `src/lib/websocket.ts`
3. Restart Railway service
4. Check Railway logs for initialization errors

---

#### Issue: WebSocket connects but disconnects immediately

**Symptoms:**

- Connection established briefly
- Immediately disconnects
- Reconnection loop

**Debug Steps:**

1. **Check authentication:**

```javascript
// In src/stores/collaborative-flow-store.ts
// Verify user is authenticated before connecting
```

2. **Check Railway logs for errors:**

```bash
railway logs --tail
# Look for disconnect reasons
```

3. **Verify Redis connection:**

```bash
# Redis should be accessible
# Check Railway logs for: "Redis connected successfully"
```

**Solutions:**

1. Ensure user is authenticated before WebSocket connection
2. Verify Redis Cloud credentials are correct
3. Check Redis Cloud allows connections from Railway IPs
4. Increase timeout values in Socket.IO config

---

### 3. Redis Connection Issues

#### Issue: "Redis connection error"

**Error Message:**

```
Redis connection error: ECONNREFUSED
Redis connection error: ETIMEDOUT
```

**Debug Steps:**

1. **Verify Redis Cloud credentials:**

```env
REDIS_HOST=xxx.redns.redis-cloud.com
REDIS_PORT=xxxxx
REDIS_USERNAME=default
REDIS_PASSWORD=xxxxx
REDIS_DB=xxx
```

2. **Test Redis connection:**

```bash
# Using Railway CLI
railway run node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD
});
redis.ping().then(console.log).catch(console.error);
"
```

3. **Check Redis Cloud dashboard:**

- Verify instance is running
- Check connection limits
- Verify IP whitelist (should allow all IPs or Railway IPs)

**Solutions:**

1. Double-check all Redis credentials
2. Ensure Redis Cloud allows connections from any IP
3. Verify Redis instance is not paused/stopped
4. Check Redis Cloud connection limits

---

#### Issue: Redis commands timing out

**Error Message:**

```
Error: Command timed out
```

**Solutions:**

1. Increase timeout in `src/lib/redis.ts`:

```typescript
const redis = new Redis({
  // ... other config
  connectTimeout: 10000,
  commandTimeout: 5000,
})
```

2. Check Redis Cloud performance metrics
3. Upgrade Redis Cloud plan if hitting limits

---

### 4. Database Connection Issues

#### Issue: "Database connection failed"

**Error Message:**

```
Error: Can't reach database server
P1001: Can't reach database server at xxx
```

**Debug Steps:**

1. **Verify Supabase connection strings:**

```env
# For connection pooling (pgBouncer)
DATABASE_URL=postgresql://postgres:xxx@xxx.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&pool_timeout=30

# For direct connection (migrations)
DIRECT_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres?connect_timeout=30
```

2. **Test database connection:**

```bash
railway run npx prisma db pull
```

3. **Check Supabase dashboard:**

- Verify database is running
- Check connection pooler is enabled
- Verify password is correct

**Solutions:**

1. Ensure `DATABASE_URL` uses port 6543 (pgBouncer)
2. Ensure `DIRECT_URL` uses port 5432 (direct)
3. Add connection timeout parameters
4. Check Supabase allows connections from Railway

---

#### Issue: "Too many connections"

**Error Message:**

```
Error: Too many connections
P1001: Can't reach database server (connection pool exhausted)
```

**Solutions:**

1. Use pgBouncer (port 6543) in `DATABASE_URL`
2. Reduce connection pool size in Prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  // Add connection limit
  relationMode = "prisma"
}
```

3. Upgrade Supabase plan for more connections

---

### 5. File Upload Issues

#### Issue: File upload fails

**Error Message:**

```
Error: Failed to upload file to Supabase
StorageError: Bucket not found
```

**Debug Steps:**

1. **Verify Supabase credentials:**

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

2. **Check Supabase Storage:**

- Verify bucket exists
- Check bucket is public or has correct RLS policies
- Verify service role key has storage permissions

3. **Test upload manually:**

```javascript
// In browser console
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test upload
const file = new File(['test'], 'test.txt')
supabase.storage
  .from('your-bucket')
  .upload('test.txt', file)
  .then(console.log)
  .catch(console.error)
```

**Solutions:**

1. Create storage bucket in Supabase dashboard
2. Set up RLS policies for bucket
3. Verify service role key is correct
4. Check file size limits

---

### 6. Authentication Issues

#### Issue: NextAuth callback URL mismatch

**Error Message:**

```
Error: Callback URL mismatch
```

**Solutions:**

1. Update `NEXTAUTH_URL` to Railway domain:

```env
NEXTAUTH_URL=https://your-app.railway.app
```

2. Update OAuth provider callback URLs:

- **Discord:** `https://your-app.railway.app/api/auth/callback/discord`
- **Google:** `https://your-app.railway.app/api/auth/callback/google`

---

#### Issue: Session not persisting

**Symptoms:**

- User logs in but session doesn't persist
- Redirected to login page after refresh

**Solutions:**

1. Verify `NEXTAUTH_SECRET` is set
2. Check database session table exists
3. Verify cookies are being set (check browser DevTools)
4. Ensure HTTPS is enabled (Railway provides this)

---

### 7. Environment Variable Issues

#### Issue: Environment variables not loading

**Symptoms:**

- `undefined` values in code
- Features not working
- Build succeeds but runtime fails

**Debug Steps:**

1. **Check Railway dashboard:**

- Go to Variables tab
- Verify all variables are set
- Check for typos

2. **Check variable naming:**

```env
# Client-side variables MUST start with NEXT_PUBLIC_
NEXT_PUBLIC_WS_URL=xxx  ✅
WS_URL=xxx              ❌ Won't work in browser
```

3. **Verify in Railway logs:**

```bash
railway logs
# Look for: "Environment variables loaded"
```

**Solutions:**

1. Re-add missing variables in Railway dashboard
2. Ensure client-side variables have `NEXT_PUBLIC_` prefix
3. Restart Railway service after adding variables
4. Check for special characters in values (escape if needed)

---

### 8. Performance Issues

#### Issue: Slow response times

**Symptoms:**

- Pages load slowly
- API calls timeout
- WebSocket lag

**Debug Steps:**

1. **Check Railway metrics:**

- CPU usage
- Memory usage
- Network traffic

2. **Check database performance:**

- Query execution time
- Connection pool usage
- Index usage

3. **Check Redis performance:**

- Command latency
- Memory usage
- Connection count

**Solutions:**

1. Optimize database queries (add indexes)
2. Implement caching strategies
3. Upgrade Railway plan for more resources
4. Optimize React Flow rendering
5. Reduce WebSocket message frequency

---

### 9. Deployment Issues

#### Issue: Deployment stuck or failing

**Symptoms:**

- Deployment hangs at build step
- Deployment fails without clear error
- Service won't start

**Solutions:**

1. **Check Railway logs:**

```bash
railway logs --deployment
```

2. **Clear Railway cache:**

- Go to Railway dashboard
- Settings → Clear build cache
- Redeploy

3. **Verify build locally:**

```bash
npm install
npm run build
npm run start
```

4. **Check Railway service status:**

- Railway dashboard → Service status
- Restart service if needed

---

## 🔍 Debugging Tools

### Railway CLI Commands

```bash
# View logs
railway logs

# View logs in real-time
railway logs --tail

# View deployment logs
railway logs --deployment

# Run command in Railway environment
railway run <command>

# Open Railway shell
railway shell

# Check service status
railway status
```

### Browser Console Debugging

```javascript
// Check WebSocket connection
console.log('Socket connected:', socket.connected)
console.log('Socket ID:', socket.id)

// Check environment variables
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

// Test Socket.IO events
socket.on('connect', () => console.log('✅ Connected'))
socket.on('disconnect', () => console.log('❌ Disconnected'))
socket.on('error', (err) => console.error('❌ Error:', err))
```

### Database Debugging

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

-- Check active sessions
SELECT * FROM "Session"
WHERE expires > NOW();

-- Check flow rooms
SELECT * FROM "FlowRoom"
ORDER BY "updatedAt" DESC;
```

---

## 📞 Getting Help

### Railway Support

- **Discord:** https://discord.gg/railway
- **Docs:** https://docs.railway.app
- **Status:** https://status.railway.app

### Supabase Support

- **Discord:** https://discord.supabase.com
- **Docs:** https://supabase.com/docs
- **Status:** https://status.supabase.com

### Redis Cloud Support

- **Support:** https://redis.io/support
- **Docs:** https://redis.io/docs/cloud

---

## ✅ Health Check Checklist

Use this checklist to verify your deployment is healthy:

- [ ] App loads at Railway URL
- [ ] Authentication works (login/logout)
- [ ] WebSocket connects (check browser console)
- [ ] Redis connection successful (check Railway logs)
- [ ] Database queries work
- [ ] File upload/download works
- [ ] React Flow rooms can be created
- [ ] Real-time collaboration works (test with 2 tabs)
- [ ] No errors in Railway logs
- [ ] No errors in browser console

---

**💡 Tip:** Most issues are related to environment variables or connection strings. Always double-check these first!
