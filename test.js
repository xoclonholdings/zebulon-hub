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
    
    // Test creating a user (update schema to match our current one)
    const testUser = await prisma.user.create({
      data: {
        username: 'test-user-' + Date.now(),
        passwordHash: 'test-hash-' + Date.now(),
        role: 'user'
      }
    })
    console.log('✅ Test user created:', testUser.username)
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log('✅ Test user cleaned up')
    
    console.log('🎉 Database test completed successfully!')
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
