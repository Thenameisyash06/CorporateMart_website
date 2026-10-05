// Vercel Serverless Function Catch-All Entry Point
// Routes all /api/* requests (e.g. /api/auth/me, /api/client/dashboard, /api/visitors/hit)
// to the CorporateMart Express app
const app = require('../server/server');

module.exports = app;
