// Test API health endpoint
const https = require('https');

const options = {
  hostname: 'gemach-management-system-production.up.railway.app',
  port: 443,
  path: '/api/health',
  method: 'GET'
};

console.log('Testing /api/health endpoint...\n');

https.get(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
}).on('error', (err) => {
  console.log('❌ Error:', err.message);
});
