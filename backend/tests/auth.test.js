const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const testUser = {
  email: 'test@example.com',
  password: 'test123'
};

async function testAuth() {
  console.log('Starting authentication tests...');

  try {
    // Test 1: Login
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
    console.log('Login successful:', loginResponse.data);
    
    // Save the token for subsequent requests
    const token = loginResponse.data.token;
    const config = {
      headers: { 'x-auth-token': token }
    };

    // Test 2: Get current user
    console.log('\nTesting get current user...');
    const userResponse = await axios.get(`${API_URL}/auth/user`, config);
    console.log('Current user:', userResponse.data);

    // Test 3: Access protected route
    console.log('\nTesting protected route access...');
    const profileResponse = await axios.get(`${API_URL}/profile`, config);
    console.log('Protected route access successful:', profileResponse.data);

    // Test 4: Logout
    console.log('\nTesting logout...');
    const logoutResponse = await axios.post(`${API_URL}/auth/logout`, {}, config);
    console.log('Logout successful:', logoutResponse.data);

    // Test 5: Verify protected route is inaccessible after logout
    console.log('\nTesting protected route after logout...');
    try {
      await axios.get(`${API_URL}/profile`, config);
      console.log('❌ Error: Protected route accessible after logout');
    } catch (error) {
      console.log('✅ Success: Protected route inaccessible after logout');
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAuth(); 