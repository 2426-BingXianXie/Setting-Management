/**
 * index.js - Server Startup
 *
 * Imports the Express app from app.js and starts the HTTP server.
 * This separation allows tests to import the app without starting the server.
 */

import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});