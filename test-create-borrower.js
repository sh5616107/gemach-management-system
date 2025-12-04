/**
 * סקריפט ליצירת לווה לבדיקה
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002';

async function test() {
  try {
    // 1. Login
    console.log('🔐 מתחבר...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginRes.data.access_token;
    console.log('✅ התחברות הצליחה!');
    
    // 2. Create Borrower
    console.log('\n👤 יוצר לווה...');
    const borrowerRes = await axios.post(`${API_URL}/api/borrowers`, {
      firstName: 'יוסי',
      lastName: 'כהן',
      city: 'ירושלים',
      phone: '050-1234567',
      address: 'רחוב הרצל 1',
      email: 'yossi@example.com',
      idNumber: '000000018' // מספר זהות תקין עם ספרת ביקורת
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ לווה נוצר:', borrowerRes.data);
    
    // 3. Get All Borrowers
    console.log('\n📋 מביא את כל הלווים...');
    const borrowersRes = await axios.get(`${API_URL}/api/borrowers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ נמצאו ${borrowersRes.data.length} לווים`);
    console.log(borrowersRes.data);
    
  } catch (error) {
    console.error('❌ שגיאה:', error.response?.data || error.message);
  }
}

test();
