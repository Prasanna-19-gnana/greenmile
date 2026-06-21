const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/trips/compare',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, '\nBody:', body));
});
req.write(JSON.stringify({source: "maraimali nagar", destination: "vellore", distance_km: 100}));
req.end();
