// Simple test to verify login API is working
// This can be run with: node test-login.js

const testLoginAPI = async () => {
  try {
    console.log('🧪 Testing login API endpoint...');
    
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('📋 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login API is working!');
      console.log('👤 Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Login failed with status:', response.status);
      console.log('📄 Error response:', errorText);
    }
  } catch (error) {
    console.error('🚨 Network error testing login API:', error.message);
  }
};

// Test CORS preflight
const testCORS = async () => {
  try {
    console.log('🔐 Testing CORS configuration...');
    
    const response = await fetch('http://localhost:8080/api/ping', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📋 CORS test status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CORS configuration is working!');
      console.log('📄 Ping response:', data);
    } else {
      console.log('❌ CORS test failed with status:', response.status);
    }
  } catch (error) {
    console.error('🚨 CORS test error:', error.message);
  }
};

// Run tests
console.log('🚀 Starting API tests...\n');
testCORS().then(() => {
  console.log('\n');
  return testLoginAPI();
}).then(() => {
  console.log('\n✨ API tests completed!');
}).catch(error => {
  console.error('💥 Test failed:', error);
});
