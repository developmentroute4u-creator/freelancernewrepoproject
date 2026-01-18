# MongoDB Atlas Migration Guide

This guide will help you migrate from a local MongoDB database to MongoDB Atlas (cloud database).

## Prerequisites

- MongoDB Atlas account (free tier available)
- Access to your local MongoDB database (for data migration)
- Your application's `.env` file

## Step 1: Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**

   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account (or login if you already have one)

2. **Create a New Cluster**

   - Click "Build a Database"
   - Choose "M0 FREE" tier (or select a paid tier for production)
   - Select your preferred cloud provider and region
   - Click "Create"

3. **Create Database User**

   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and generate a secure password (save this!)
   - Set user privileges to "Atlas admin" (or custom role as needed)
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses only
   - Click "Confirm"

## Step 2: Get Connection String

1. **Get Connection String**

   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" as driver
   - Copy the connection string (it looks like):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

2. **Replace Placeholders**
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add your database name at the end (before `?`):
     ```
     mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skill-platform?retryWrites=true&w=majority
     ```

## Step 3: Update Environment Variables

1. **Update Server .env File**

   Open `server/.env` and update the `MONGODB_URI`:

   ```env
   # Before (Local MongoDB)
   MONGODB_URI=mongodb://localhost:27017/skill-platform

   # After (MongoDB Atlas)
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skill-platform?retryWrites=true&w=majority
   ```

   **Important Notes:**

   - Replace `username` and `password` with your actual credentials
   - Replace `cluster0.xxxxx.mongodb.net` with your actual cluster URL
   - Replace `skill-platform` with your desired database name
   - URL-encode special characters in password (e.g., `@` becomes `%40`)

2. **Example with URL-encoded password:**
   ```env
   # If your password is: MyP@ssw0rd!
   # It should be: MyP%40ssw0rd%21
   MONGODB_URI=mongodb+srv://myuser:MyP%40ssw0rd%21@cluster0.xxxxx.mongodb.net/skill-platform?retryWrites=true&w=majority
   ```

## Step 4: Migrate Data (Optional)

If you have existing data in your local MongoDB, you'll need to migrate it:

### Option A: Using mongodump and mongorestore (Recommended)

1. **Export from Local MongoDB:**

   ```bash
   mongodump --uri="mongodb://localhost:27017/skill-platform" --out=./backup
   ```

2. **Import to MongoDB Atlas:**
   ```bash
   mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skill-platform" ./backup/skill-platform
   ```

### Option B: Using MongoDB Compass

1. **Export from Local:**

   - Open MongoDB Compass
   - Connect to local MongoDB
   - Export collections individually (JSON or CSV)

2. **Import to Atlas:**
   - Connect to MongoDB Atlas in Compass
   - Import the exported files

### Option C: Start Fresh (If no important data)

If you don't have important data, you can start fresh:

- The application will create collections automatically on first run
- You'll need to recreate admin users and any test data

## Step 5: Test Connection

1. **Restart Your Server:**

   ```bash
   cd server
   npm run dev
   ```

2. **Check Logs:**

   - You should see: `✅ MongoDB connected successfully (Atlas)`
   - If you see errors, check:
     - Connection string format
     - Username/password are correct
     - Network access is configured
     - IP address is whitelisted

3. **Verify Connection:**
   - Check MongoDB Atlas dashboard
   - Go to "Database" → Your cluster
   - You should see your database and collections appear

## Step 6: Update Production Environment

If deploying to production:

1. **Use Environment Variables:**

   - Never commit `.env` files to git
   - Use your hosting platform's environment variable settings
   - Set `MONGODB_URI` in your production environment

2. **Security Best Practices:**
   - Use strong passwords
   - Whitelist only production server IPs
   - Use database users with minimal required permissions
   - Enable MongoDB Atlas monitoring and alerts

## Troubleshooting

### Connection Timeout

- **Issue**: Connection times out
- **Solution**:
  - Check network access IP whitelist
  - Verify connection string format
  - Check firewall settings

### Authentication Failed

- **Issue**: Authentication error
- **Solution**:
  - Verify username and password
  - URL-encode special characters in password
  - Check user has proper permissions

### SSL/TLS Error

- **Issue**: SSL connection error
- **Solution**:
  - MongoDB Atlas requires SSL (handled automatically by `mongodb+srv://`)
  - Ensure you're using `mongodb+srv://` not `mongodb://`

### Database Not Found

- **Issue**: Database doesn't exist
- **Solution**:
  - MongoDB Atlas creates databases automatically
  - Ensure database name is in connection string
  - Check collections are being created

### Slow Queries

- **Issue**: Queries are slow
- **Solution**:
  - Check cluster tier (free tier has limitations)
  - Create indexes on frequently queried fields
  - Monitor performance in Atlas dashboard

## Connection String Examples

### Development (Free Tier)

```env
MONGODB_URI=mongodb+srv://devuser:devpass123@cluster0.abc123.mongodb.net/skill-platform-dev?retryWrites=true&w=majority
```

### Production (Paid Tier)

```env
MONGODB_URI=mongodb+srv://produser:SecureP@ssw0rd!@cluster0.xyz789.mongodb.net/skill-platform?retryWrites=true&w=majority&ssl=true
```

## Additional MongoDB Atlas Features

Once migrated, you can use:

1. **Atlas Search** - Full-text search capabilities
2. **Atlas Charts** - Data visualization
3. **Atlas Data Lake** - Data lake integration
4. **Backup & Restore** - Automated backups
5. **Performance Monitoring** - Query performance insights
6. **Alerts** - Set up alerts for various metrics

## Rollback Plan

If you need to rollback to local MongoDB:

1. Update `.env`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/skill-platform
   ```

2. Ensure local MongoDB is running

3. Restart the server

## Support

- MongoDB Atlas Documentation: [https://docs.atlas.mongodb.com/](https://docs.atlas.mongodb.com/)
- MongoDB Community Forums: [https://developer.mongodb.com/community/forums/](https://developer.mongodb.com/community/forums/)
