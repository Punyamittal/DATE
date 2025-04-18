# VIT Dating App

A dating app specifically designed for VIT University students.

## Directory Structure
```
vit-dating-app/
├── .env                        # Root environment variables
├── package.json                # Root package.json with workspace config
├── chat-app/                   # Main Next.js frontend
│   ├── src/                    # Frontend source code
│   └── package.json            # Frontend dependencies
│   ├── backend/                # Express.js backend
│       ├── middleware/         # Auth middleware
│       ├── models/             # Mongoose models
│       ├── routes/             # API routes
│       ├── utils/              # Utility functions
│       ├── server.js           # Main server entry point
│       ├── startServer.js      # Port-conflict-safe server starter
│       └── package.json        # Backend dependencies
```

## Local Development

### Prerequisites
- Node.js (v18+)
- npm (v8+)
- MongoDB (optional, in-memory DB available)

### Setup
1. Clone the repository
   ```bash
   git clone https://github.com/Punyamittal/DATE.git
   cd vit-dating-app
   ```

2. Install dependencies for all workspaces
   ```bash
   npm run install:all
   ```

3. Configure environment variables
   ```bash
   # Edit the .env file with your configuration
   ```

### Running the App

#### Development Mode
Run both frontend and backend concurrently:
```bash
npm run dev
```

#### Run only the frontend
```bash
npm run dev:frontend
```

#### Run only the backend
```bash
npm run dev:backend
```

#### Start the backend with automatic port conflict resolution
```bash
cd chat-app/backend
npm run start:safe
```

### Troubleshooting
If you get a port-in-use error, you can kill the process using port 5000:
```bash
cd chat-app/backend
npm run kill-port
```

## Deployment

### Vercel Deployment
1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Configure the build settings:
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `chat-app/.next`
4. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT tokens
   - `VERCEL`: Set to "1"
   - `USE_IN_MEMORY_DB`: Set to "false" for production
   - `FRONTEND_URL`: Will be set automatically by Vercel

### Netlify Deployment
1. Fork this repository to your GitHub account
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Base directory: `./`
   - Build command: `npm run build`
   - Publish directory: `chat-app/.next`
4. Add the same environment variables as listed for Vercel

## Features
- VIT student email authentication (@vitstudent.ac.in)
- Email verification system
- Swipe-based matching (Tinder-style)
- Real-time chat with matched users
- User profiles with interests and preferences
