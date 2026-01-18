# Quick MongoDB Atlas Setup

## 5-Minute Setup Guide

### 1. Create Atlas Account & Cluster
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Sign up (free tier available)
- Create cluster → Choose "M0 FREE" → Create

### 2. Configure Access
- **Database Access**: Create user (username + password)
- **Network Access**: Add IP `0.0.0.0/0` (or your server IP)

### 3. Get Connection String
- Click "Connect" → "Connect your application"
- Copy connection string
- Replace `<username>` and `<password>`
- Add database name: `mongodb+srv://user:pass@cluster.mongodb.net/skill-platform?retryWrites=true&w=majority`

### 4. Update .env
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skill-platform?retryWrites=true&w=majority
```

### 5. Test
```bash
cd server
npm run dev
```

Look for: `✅ MongoDB connected successfully (Atlas)`

## Password URL Encoding

If your password has special characters, encode them:
- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example:**
- Password: `MyP@ss!123`
- Encoded: `MyP%40ss%21123`
- Connection string: `mongodb+srv://user:MyP%40ss%21123@cluster.mongodb.net/...`

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection timeout | Check IP whitelist in Network Access |
| Authentication failed | Verify username/password, URL-encode special chars |
| Database not found | Add database name to connection string |

For detailed guide, see `MONGODB_ATLAS_MIGRATION.md`
