// Quick test for Railway backend
const https = require('https');

const url = 'https://gemach-management-system-production.up.railway.app/health';

console.log('Testing backend at:', url);
console.log('Waiting for response...\n');

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Status Code:', res.statusCode);
    console.log('✅ Response:', data);
    
    if (res.statusCode === 200) {
      console.log('\n🎉 Backend is working!');
    } else {
      console.log('\n⚠️ Backend returned non-200 status');
    }
  });
}).on('error', (err) => {
  console.log('❌ Error:', err.message);
});
