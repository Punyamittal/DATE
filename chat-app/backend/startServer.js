const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

// Function to find available port
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is in use, trying next port...`);
    port++;
  }
  return port;
};

// Start the server with a determined available port
const startServer = async () => {
  // Load environment and set default port
  require('dotenv').config();
  const defaultPort = parseInt(process.env.PORT, 10) || 5000;
  
  try {
    // Find available port
    const availablePort = await findAvailablePort(defaultPort);
    
    // Set environment variable for the server
    const env = {...process.env, PORT: availablePort.toString()};
    
    console.log(`Starting server on port ${availablePort}...`);
    
    // Spawn new server process with the available port
    const server = spawn('node', ['server.js'], {
      env,
      stdio: 'inherit'
    });
    
    server.on('error', (err) => {
      console.error('Failed to start server:', err);
    });
    
  } catch (error) {
    console.error('Error finding available port:', error);
  }
};

// Start the server
startServer(); 