# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key

## Installation

1. **Install root dependencies:**
```bash
npm install
```

2. **Install client dependencies:**
```bash
cd client
npm install
```

3. **Install server dependencies:**
```bash
cd ../server
npm install
```

## Environment Configuration

### Server Environment (.env in server/)

**For Local MongoDB:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skill-platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GEMINI_API_KEY=your-google-gemini-api-key
```

**For MongoDB Atlas (Cloud):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skill-platform?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GEMINI_API_KEY=your-google-gemini-api-key
```

> **Note**: See `MONGODB_ATLAS_MIGRATION.md` for detailed MongoDB Atlas setup instructions.

### Client Environment (.env.local in client/)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode

From the root directory:
```bash
npm run dev
```

This will start both the Next.js frontend (port 3000) and Express backend (port 5000).

### Individual Services

**Frontend only:**
```bash
cd client
npm run dev
```

**Backend only:**
```bash
cd server
npm run dev
```

## Database Setup

### Option 1: Local MongoDB

1. Install and start MongoDB locally
2. Ensure MongoDB is running on `localhost:27017`
3. The application will automatically create collections on first run

### Option 2: MongoDB Atlas (Cloud)

1. Create a MongoDB Atlas account and cluster (see `MONGODB_ATLAS_MIGRATION.md`)
2. Get your connection string from Atlas dashboard
3. Update `MONGODB_URI` in `.env` file
4. The application will automatically create collections on first run

### Create Admin User

Create an admin user manually in MongoDB or through the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@platform.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

## Key Features

### Freelancer Flow
1. Sign up as FREELANCER
2. Complete onboarding (personal details, education, portfolio)
3. Generate and take skill test
4. Submit test (ZIP or GitHub)
5. Wait for admin review and badge award
6. View matched projects

### Client Flow
1. Sign up as CLIENT
2. Complete company profile
3. Discover freelancers (filter by badge, experience, location, field)
4. Create project:
   - Answer intent questions
   - Platform generates scope (using Gemini)
   - Choose scope mode (Platform Scope or Own Scope)
   - Choose accountability mode (Basic or Accountability)
5. Manage projects and escalate if needed

### Admin Flow
1. Review test submissions
2. Award badges (LOW/MEDIUM/HIGH)
3. Resolve escalations
4. Manage projects
5. View audit logs

## Project Structure

```
├── client/              # Next.js frontend
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities
├── server/             # Express backend
│   ├── src/
│   │   ├── models/     # MongoDB schemas
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Auth & RBAC
│   │   └── utils/      # Utilities
└── shared/             # Shared types (if needed)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Freelancers
- `POST /api/freelancers` - Create profile
- `GET /api/freelancers/me` - Get own profile
- `PATCH /api/freelancers/me` - Update profile
- `POST /api/freelancers/tests/generate` - Generate skill test
- `POST /api/freelancers/tests/:testId/submit` - Submit test
- `GET /api/freelancers/search` - Search (client/admin only)

### Clients
- `POST /api/clients` - Create profile
- `GET /api/clients/me` - Get own profile
- `PATCH /api/clients/me` - Update profile

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:projectId` - Get project
- `PATCH /api/projects/:projectId/state` - Update state

### Scopes
- `POST /api/scopes/generate` - Generate scope
- `GET /api/scopes/:scopeId` - Get scope
- `POST /api/scopes/:scopeId/lock` - Lock scope

### Escalations
- `POST /api/escalations` - Raise escalation
- `GET /api/escalations` - List escalations

### Admin
- `GET /api/admin/test-submissions` - List submissions
- `POST /api/admin/test-submissions/:id/review` - Review and award badge
- `GET /api/admin/escalations` - List escalations
- `POST /api/admin/escalations/:id/resolve` - Resolve escalation

## Important Notes

1. **Scope Immutability**: Once locked, scope cannot be changed. New scope requires new project.

2. **Badge Immutability**: Badges are immutable unless admin overrides.

3. **Accountability Mode**: Only projects with ACCOUNTABILITY mode can raise escalations.

4. **Expected Comfort Range**: This is for internal matching only, never used for bidding.

5. **No Bidding**: This platform does not support bidding or price competition.

6. **Admin Authority**: All admin decisions are final and binding.

## Troubleshooting

### MongoDB Connection Issues
- **Local MongoDB**: Ensure MongoDB is running on localhost:27017
- **MongoDB Atlas**: 
  - Check MONGODB_URI format (should use `mongodb+srv://`)
  - Verify network access IP whitelist in Atlas dashboard
  - Check username/password are correct (URL-encode special characters)
  - See `MONGODB_ATLAS_MIGRATION.md` for detailed troubleshooting

### Gemini API Errors
- Verify GEMINI_API_KEY is set correctly
- Check API quota/limits
- Fallback test/scope generation will be used if API fails

### CORS Issues
- Ensure frontend URL is allowed in backend CORS config
- Check NEXT_PUBLIC_API_URL matches backend URL

## Production Deployment

1. Set secure JWT_SECRET
2. Use production MongoDB instance
3. Configure proper CORS origins
4. Set up file storage for ZIP uploads (S3-compatible)
5. Enable HTTPS
6. Set up proper logging and monitoring
7. Configure environment variables securely
