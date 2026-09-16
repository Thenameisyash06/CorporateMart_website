// Vercel Serverless Function entry point
// Connects Vercel incoming HTTP requests to the CorporateMart Express app
const app = require('../server/server');

module.exports = app;
