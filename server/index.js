const express = require('express')
const cors = require('cors')
const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createServer } = require('http')
const { Server } = require('socket.io')
const morgan = require('morgan')
const { v4: uuidv4 } = require('uuid')

// Import services
const WhatsAppService = require('./services/whatsapp')
const GeminiService = require('./services/gemini')
const KnowledgeBase = require('./services/knowledgeBase')
const ConversationMemory = require('./services/conversationMemory')
const MessageFormatterCleaned = require('./services/messageFormatterCleaned')
const HumanReasoningEngine = require('./services/humanReasoningEngine')
const AdaptivePersonalitySystem = require('./services/adaptivePersonalitySystem')
const logger = require('./services/logger')
const HealthCheck = require('./services/healthCheck')

// Import routes
const apiStatsRoutes = require('./routes/apiStats')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || "https://your-app.onrender.com"
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Initialize enhanced services
const conversationMemory = new ConversationMemory()
const messageFormatter = new MessageFormatterCleaned()
const knowledgeBase = new KnowledgeBase()

// Initialize AI systems
const personalitySystem = new AdaptivePersonalitySystem(conversationMemory)
const geminiService = new GeminiService(conversationMemory, messageFormatter, knowledgeBase)
const humanReasoning = new HumanReasoningEngine(geminiService, conversationMemory)

// Initialize WhatsApp service
const whatsappService = new WhatsAppService()

// Initialize health check
const healthCheck = new HealthCheck(prisma, whatsappService)

// Make geminiService available to routes
app.set('geminiService', geminiService)

// Middleware
app.use((req, res, next) => {
  req.id = uuidv4()
  req.startTime = Date.now()
  next()
})

app.use(morgan('combined', { 
  stream: logger.stream,
  skip: (req, res) => req.url === '/health' || req.url === '/api/health'
}))

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXTAUTH_URL,
      'https://your-app-name.onrender.com'
    ].filter(Boolean)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())
app.use('/public', express.static('server/public'))

// Metrics middleware
app.use((req, res, next) => {
  healthCheck.incrementRequests()
  
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - req.startTime
    healthCheck.addResponseTime(duration)
    
    if (res.statusCode >= 400) {
      healthCheck.incrementErrors()
    }
    
    logger.api(req.method, req.url, res.statusCode, duration, {
      requestId: req.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })
    
    return originalSend.call(this, data)
  }
  
  next()
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)

  if (whatsappService.isConnected) {
    socket.emit('whatsapp-status', 'connected')
  } else if (whatsappService.qrCode) {
    socket.emit('whatsapp-status', 'connecting')
    socket.emit('qr-code', whatsappService.qrCode)
  } else {
    socket.emit('whatsapp-status', 'disconnected')
  }

  socket.on('connect-whatsapp', async () => {
    try {
      if (whatsappService.isConnected) {
        socket.emit('whatsapp-status', 'connected')
        return
      }
      await whatsappService.connect()
    } catch (error) {
      console.error('Error connecting WhatsApp:', error)
      socket.emit('whatsapp-error', error.message)
    }
  })

  socket.on('disconnect-whatsapp', async () => {
    try {
      await whatsappService.disconnect()
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error)
    }
  })

  socket.on('clear-whatsapp-session', async () => {
    try {
      await whatsappService.clearSession()
      socket.emit('session-cleared', { message: 'Session cleared successfully' })
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })
})

// WhatsApp service events
whatsappService.on('qr-code', (qrCode) => {
  logger.whatsapp('info', 'QR code generated for WhatsApp connection')
  io.emit('qr-code', qrCode)
  io.emit('whatsapp-status', 'connecting')
})

whatsappService.on('connected', () => {
  logger.whatsapp('info', 'WhatsApp service connected successfully')
  io.emit('whatsapp-status', 'connected')
})

whatsappService.on('disconnected', () => {
  logger.whatsapp('warn', 'WhatsApp service disconnected')
  io.emit('whatsapp-status', 'disconnected')
})

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Health check endpoint
app.get('/health', (req, res) => {
  const health = healthCheck.getHealth()
  res.status(health.status === 'healthy' ? 200 : 503).json(health)
})

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Check for default admin user
    if (email === 'admin@advisor.com' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'admin', email: 'admin@advisor.com', role: 'admin' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      )

      return res.json({
        token,
        user: {
          id: 'admin',
          email: 'admin@advisor.com',
          name: 'Administrator',
          role: 'admin'
        }
      })
    }

    // Try to find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Dashboard routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const stats = {
      totalClients: await prisma.client.count(),
      activeClients: await prisma.client.count({ where: { isActive: true } }),
      expiredClients: await prisma.client.count({ where: { isActive: false } }),
      totalMessages: await prisma.conversation.count(),
      todayMessages: await prisma.conversation.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      expiringToday: await prisma.client.count({
        where: {
          expiryDate: {
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          },
          isActive: true
        }
      })
    }

    res.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ message: 'Error fetching dashboard stats' })
  }
})

// Client routes
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ clients })
  } catch (error) {
    console.error('Clients fetch error:', error)
    res.status(500).json({ message: 'Error fetching clients' })
  }
})

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { name, phone, expiryDate } = req.body

    if (!name || !phone || !expiryDate) {
      return res.status(400).json({ message: 'Name, phone, and expiry date are required' })
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        expiryDate: new Date(expiryDate),
        isActive: true
      }
    })

    res.status(201).json(client)
  } catch (error) {
    console.error('Client creation error:', error)
    res.status(500).json({ message: 'Error creating client' })
  }
})

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, expiryDate } = req.body

    const updateData = { name, phone }
    if (expiryDate) {
      updateData.expiryDate = new Date(expiryDate)
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData
    })

    res.json(client)
  } catch (error) {
    console.error('Client update error:', error)
    res.status(500).json({ message: 'Error updating client' })
  }
})

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    await prisma.client.delete({ where: { id } })
    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Client deletion error:', error)
    res.status(500).json({ message: 'Error deleting client' })
  }
})

// API Stats routes
app.use('/api/stats', apiStatsRoutes)

// Notifications endpoint
app.get('/api/notifications/count', authenticateToken, (req, res) => {
  res.json({ count: 0 })
})

// Initialize WhatsApp when server starts
setTimeout(async () => {
  try {
    console.log('🚀 Starting WhatsApp service...')
    await whatsappService.connect()
  } catch (error) {
    console.error('❌ Failed to start WhatsApp service:', error.message)
  }
}, 5000)

// Cleanup function
async function cleanup() {
  console.log('🧹 Cleaning up...')
  try {
    await whatsappService.disconnect()
    await prisma.$disconnect()
    server.close()
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check available at http://localhost:${PORT}/health`)
  logger.info(`Server started on port ${PORT}`)
})