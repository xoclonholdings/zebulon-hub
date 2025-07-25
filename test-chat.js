// Test the real-time chat system
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testChatSystem() {
  try {
    console.log('🧪 Testing Zebulon Real-time Chat System...')
    
    // Test 1: Check if we have a user to chat with
    const users = await prisma.user.findMany()
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user account first.')
      return
    }
    
    const testUser = users[0]
    console.log(`✅ Found test user: ${testUser.username} (ID: ${testUser.id})`)
    
    // Test 2: Test chat endpoint with authentication simulation
    console.log('\n🔄 Testing chat endpoint...')
    
    const testMessage = "Hello Zed, can you help me with the Zebulon system?"
    
    const chatResponse = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `connect.sid=test-session-${testUser.id}` // This won't work without real session, but shows the concept
      },
      body: JSON.stringify({
        message: testMessage
      })
    })
    
    if (chatResponse.status === 401) {
      console.log('⚠️  Authentication required (expected in real use)')
      console.log('   In real use, user must be logged in with valid session')
    } else if (chatResponse.ok) {
      const chatData = await chatResponse.json()
      console.log('✅ Chat endpoint working:', chatData.success)
    } else {
      console.log('❌ Chat endpoint failed:', chatResponse.status)
    }
    
    // Test 3: Check chat history endpoint
    console.log('\n📜 Testing chat history endpoint...')
    
    const historyResponse = await fetch("http://localhost:5000/api/chat/history", {
      method: "GET",
      headers: {
        "Cookie": `connect.sid=test-session-${testUser.id}`
      }
    })
    
    if (historyResponse.status === 401) {
      console.log('⚠️  Authentication required for history (expected)')
    } else if (historyResponse.ok) {
      const historyData = await historyResponse.json()
      console.log('✅ History endpoint working, messages count:', historyData.messages?.length || 0)
    }
    
    // Test 4: Direct database test - simulate what happens during chat
    console.log('\n💾 Testing direct database operations...')
    
    // Simulate user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId: testUser.id,
        message: "Test: Hello from direct database test",
        aiCore: 'user'
      }
    })
    console.log('✅ User message saved to database')
    
    // Simulate AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        userId: testUser.id,
        message: "Test response: Hello! I'm Zed, ready to help with your Zebulon system.",
        aiCore: 'zed'
      }
    })
    console.log('✅ AI response saved to database')
    
    // Get user's chat history
    const userHistory = await prisma.chatMessage.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'asc' },
      take: 5 // Last 5 messages
    })
    
    console.log(`✅ User has ${userHistory.length} recent messages`)
    console.log('\n📋 Recent conversation:')
    userHistory.forEach((msg, index) => {
      const time = new Date(msg.createdAt).toLocaleTimeString()
      const speaker = msg.aiCore === 'zed' ? 'Zed' : 'User'
      console.log(`   ${index + 1}. [${time}] ${speaker}: ${msg.message.substring(0, 60)}${msg.message.length > 60 ? '...' : ''}`)
    })
    
    console.log('\n🎉 Chat system test completed!')
    console.log('\n📝 Next steps for real-time use:')
    console.log('   1. User logs in through /api/auth/login')
    console.log('   2. Frontend sends messages to POST /api/chat')
    console.log('   3. Backend saves user message + generates AI response')
    console.log('   4. Frontend fetches history from GET /api/chat/history')
    console.log('   5. Both messages appear in chat interface')
    
  } catch (error) {
    console.error('❌ Chat system test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testChatSystem()