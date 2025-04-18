# VIT Dating App

A dating app specifically designed for VIT University students.

## Deployment to Vercel

### Prerequisites

1. Create a [Vercel account](https://vercel.com/signup) if you don't have one
2. Install the Vercel CLI: `npm i -g vercel`
3. Set up a MongoDB Atlas account for database storage in production

### Environment Variables

Set the following environment variables in your Vercel project settings:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure secret key for JWT token generation
- `VERCEL`: Set to "1" to enable serverless mode
- `USE_IN_MEMORY_DB`: Set to "false" for production
- `FRONTEND_URL`: Your deployed frontend URL (will be set automatically by Vercel)

### Deployment Steps

1. Push your code to GitHub
2. Link your GitHub repository to Vercel
3. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `chat-app/.next`
4. Add the environment variables mentioned above
5. Deploy!

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   cd chat-app
   npm install
   cd backend
   npm install
   ```
3. Start the backend server:
   ```
   cd chat-app/backend
   node server.js
   ```
4. Start the frontend:
   ```
   cd chat-app
   npm run dev
   ```
5. Access the app at http://localhost:3000
