// Test login to backend
const https = require('https');

const data = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const options = {
  hostname: 'gemach-management-system-production.up.railway.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing login...');
console.log('URL: https://gemach-management-system-production.up.railway.app/api/auth/login');
console.log('Username: admin');
console.log('Password: admin123\n');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Login successful!');
      try {
        const json = JSON.parse(responseData);
        console.log('Token:', json.token ? 'Received ✓' : 'Missing ✗');
        console.log('User:', json.user ? json.user.username : 'Missing');
      } catch (e) {
        console.log('Could not parse JSON response');
      }
    } else {
      console.log('\n❌ Login failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
