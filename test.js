import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check existing users
    const userCount = await prisma.user.count()
    console.log(`📊 Current users in database: ${userCount}`)
    
    // Test the log endpoint
    console.log('Testing /api/log endpoint...')
    const response = await fetch("http://localhost:5000/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: 1,
        message: "Test message from database test",
        aiCore: "zed"
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ Log endpoint test successful:", data.success)
    } else {
      console.log("❌ Log endpoint test failed:", response.status)
    }
    
    console.log('🎉 Database and API test completed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()