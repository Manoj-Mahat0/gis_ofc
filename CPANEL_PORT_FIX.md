# cPanel Port Configuration Fix

## Error: EADDRINUSE - Port Already in Use

This error occurs because cPanel manages ports automatically and port 5000 is already taken.

## Solution

### Option 1: Let cPanel Manage the Port (Recommended)

cPanel's Node.js environment automatically assigns a port. You don't need to specify it.

**In cPanel Node.js App Setup:**
1. Go to **Setup Node.js App**
2. Edit your application
3. **Remove** PORT from environment variables (let cPanel handle it)
4. Or set it to a unique port like `3001`, `3002`, etc.
5. Click **Restart**

### Option 2: Use a Different Port

If you need to specify a port, use one that's not in use:

**Update .env on server:**
```env
PORT=3001
```

Or try these ports: 3001, 3002, 8080, 8081, 8888

### Option 3: Stop Existing Process

If there's an old instance running:

**Via cPanel Terminal:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

Or simply **Restart** the app in cPanel Node.js interface.

## cPanel Node.js App Configuration

### Correct Settings:

1. **Application root**: `/home/globalin/office.globalinfosoft.in`
2. **Application startup file**: `server.js`
3. **Node.js version**: 18.x or higher
4. **Application mode**: Production

### Environment Variables (in cPanel):

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://manojmahato08779_db_user:EPIyIpOpxDWMpWfw@cluster0.pcrpxcc.mongodb.net/telecaller_system?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=telecaller_jwt_secret_key_2024_change_in_production_xyz789
JWT_EXPIRE=30d
```

**Note:** Don't set PORT in cPanel environment variables - let cPanel assign it automatically.

## How cPanel Node.js Works

cPanel uses **Passenger** to run Node.js apps:
- Passenger automatically assigns an available port
- Your app is accessible via the domain (not port number)
- The PORT environment variable is set by Passenger
- You access via: `https://office.globalinfosoft.in` (not `https://office.globalinfosoft.in:5000`)

## Testing

After configuration:

1. **Restart** the app in cPanel
2. Visit: `https://office.globalinfosoft.in/health`
3. Should return: `{"status":"OK","message":"Server is running"}`

## If Still Getting Error

### Check for Multiple Instances:

```bash
# Via cPanel Terminal
cd /home/globalin/office.globalinfosoft.in
ps aux | grep node
```

If you see multiple node processes, kill them:
```bash
pkill -f node
```

Then restart via cPanel Node.js App interface.

### Check Application Logs:

In cPanel → Setup Node.js App → Click on your app → View logs

## Alternative: Use app.js Entry Point

cPanel sometimes works better with `app.js`:

**Update cPanel Node.js App:**
- Application startup file: `app.js` (instead of `server.js`)

The `app.js` file already exists and points to `server.js`.

## Success Indicators

✅ No port errors in logs
✅ App shows "Running" status in cPanel
✅ Health endpoint accessible: `https://office.globalinfosoft.in/health`
✅ MongoDB connected message in logs

## Common cPanel Ports

If you must specify a port, these are commonly available:
- 3000-3010
- 8080-8090
- 9000-9010

Avoid: 80, 443, 5000, 3306, 21, 22 (usually reserved)

## Quick Fix Commands

```bash
# Stop all node processes
pkill -f node

# Restart via cPanel
# Go to Setup Node.js App → Restart

# Check if port is free
netstat -tuln | grep 5000

# Use different port
export PORT=3001
npm start
```

## Production Checklist

- [ ] Remove PORT from cPanel environment variables
- [ ] Let cPanel/Passenger manage the port
- [ ] Restart application
- [ ] Test health endpoint
- [ ] Check application logs
- [ ] Verify MongoDB connection

Your app should now work without port conflicts!
