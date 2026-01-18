# Skill-Based Execution Platform

An execution governance platform focused on skill verification, scope ownership, and accountability.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Auth**: Auth.js (NextAuth)
- **AI**: Google Gemini API

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
- Copy `.env.example` to `.env` in both `client/` and `server/` directories
- Fill in required values

3. Run development servers:
```bash
npm run dev
```

## Project Structure

```
├── client/          # Next.js frontend
├── server/          # Express.js backend
└── shared/          # Shared types and utilities
```

## Core Features

- Skill-verified freelancer onboarding
- Scope ownership system (PDF-driven)
- Accountability as a service
- Admin authority module
- Complete audit logging
