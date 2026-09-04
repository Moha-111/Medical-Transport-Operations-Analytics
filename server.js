const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middleware for JSON parsing if needed
app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'وصل - نظام إدارة نقل المرضى' });
});

// Serve static assets from root
app.use(express.static(path.join(__dirname)));

// SPA Fallback for navigation routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
