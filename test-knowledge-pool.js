// Test script for Knowledge Pool functionality
// Run with: node test-knowledge-pool.js

const API_BASE = 'http://localhost:5000/api/knowledge';

async function testKnowledgePool() {
  console.log('🧪 Testing Knowledge Pool System\n');

  // Test 1: Check status
  console.log('1. Checking knowledge source status...');
  try {
    const statusResponse = await fetch(`${API_BASE}/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status check successful');
    console.log('Available sources:', Object.keys(statusData.sources).filter(key => statusData.sources[key].available));
    console.log('Unavailable sources:', Object.keys(statusData.sources).filter(key => !statusData.sources[key].available));
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }

  console.log('\n2. Testing knowledge query...');
  try {
    const queryResponse = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Explain the concept of artificial intelligence',
        targetCore: 'zed'
      })
    });
    const queryData = await queryResponse.json();
    console.log('✅ Knowledge query completed');
    console.log('Success:', queryData.data.success);
    console.log('Fallback used:', queryData.data.fallbackUsed);
    console.log('Active sources:', queryData.data.sources.filter(s => s.status === 'active').length);
    console.log('Failed sources:', queryData.data.sources.filter(s => s.status === 'failed').length);
  } catch (error) {
    console.log('❌ Knowledge query failed:', error.message);
  }

  console.log('\n3. Checking feed data...');
  try {
    const feedResponse = await fetch(`${API_BASE}/feed`);
    const feedData = await feedResponse.json();
    console.log('✅ Feed check successful');
    console.log('Total entries:', feedData.count);
    if (feedData.count > 0) {
      console.log('Latest query:', feedData.data[0].query);
    }
  } catch (error) {
    console.log('❌ Feed check failed:', error.message);
  }

  console.log('\n🔬 Knowledge Pool test completed!');
}

testKnowledgePool().catch(console.error);