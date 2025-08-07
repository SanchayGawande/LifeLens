#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 19006;
const webBuildDir = './web-build';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  let filePath = path.join(webBuildDir, req.url === '/' ? 'index.html' : req.url);
  
  // Handle SPA routing - serve index.html for non-asset requests
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(webBuildDir, 'index.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`✅ LifeLens web app running at http://127.0.0.1:${port}`);
  console.log(`✅ Access your app at http://localhost:${port}`);
});