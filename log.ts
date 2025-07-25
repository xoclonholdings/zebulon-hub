import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

router.post('/log', async (req, res) => {
const { userId, message, aiCore = 'zed' } = req.body

if (!userId || !message) {
return res.status(400).json({ error: 'Missing userId or message' })
}

try {
const newLog = await prisma.chatMessage.create({
data: {
userId,
message,
aiCore
}
})
res.json({ success: true, log: newLog })
} catch (err) {
console.error('❌ Logging failed:', err)
res.status(500).json({ error: 'Failed to log message' })
}
})

export default router
