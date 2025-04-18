// Vercel API entry point for serverless functions
const app = require('../backend/server');

// Handle serverless function requests
module.exports = (req, res) => {
  // Forward the request to Express app
  return app(req, res);
}; 