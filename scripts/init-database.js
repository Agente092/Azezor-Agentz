#!/usr/bin/env node

// =================================
// Script de Inicialización de Base de Datos
// Para uso en producción con Render.com
// =================================

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function initializeDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🚀 Iniciando configuración de base de datos...')
    
    // Verificar conexión a la base de datos
    await prisma.$connect()
    console.log('✅ Conexión a PostgreSQL establecida')
    
    // Aplicar schema de Prisma
    console.log('📋 Aplicando schema de base de datos...')
    // Nota: En Render, esto se hace con "npx prisma db push" en el build
    
    // Verificar tablas existentes
    const clientCount = await prisma.client.count()
    console.log(`📊 Clientes existentes: ${clientCount}`)
    
    const conversationCount = await prisma.conversation.count()
    console.log(`💬 Conversaciones existentes: ${conversationCount}`)
    
    // Crear configuraciones por defecto si no existen
    await createDefaultSettings(prisma)
    
    // Crear cliente de prueba si no hay ninguno
    if (clientCount === 0) {
      await createTestClient(prisma)
    }
    
    console.log('🎉 Base de datos inicializada correctamente')
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function createDefaultSettings(prisma) {
  console.log('⚙️ Configurando ajustes por defecto...')
  
  const defaultSettings = [
    { key: 'app_name', value: 'WhatsApp Business Advisor' },
    { key: 'company_name', value: 'GHS' },
    { key: 'representative_name', value: 'Luis G.' },
    { key: 'max_daily_messages', value: '100' },
    { key: 'welcome_message', value: 'Bienvenido al servicio de asesoría empresarial' },
    { key: 'business_hours_start', value: '09:00' },
    { key: 'business_hours_end', value: '18:00' },
    { key: 'auto_responses', value: 'true' },
    { key: 'api_rotation', value: 'true' }
  ]
  
  for (const setting of defaultSettings) {
    try {
      await prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
      console.log(`  ✅ ${setting.key}: ${setting.value}`)
    } catch (error) {
      console.log(`  ⚠️ Error con ${setting.key}:`, error.message)
    }
  }
}

async function createTestClient(prisma) {
  console.log('👤 Creando cliente de prueba...')
  
  const testClient = {
    name: 'Cliente de Prueba',
    phone: '51900000000',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    isActive: true,
    messageCount: 0
  }
  
  try {
    const client = await prisma.client.create({
      data: testClient
    })
    console.log(`  ✅ Cliente creado: ${client.name} (${client.phone})`)
    console.log(`  📅 Expira: ${client.expiryDate.toLocaleDateString()}`)
  } catch (error) {
    console.log(`  ⚠️ Error creando cliente de prueba:`, error.message)
  }
}

// Función para verificar el estado de la base de datos
async function checkDatabaseHealth() {
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    
    const stats = {
      clients: await prisma.client.count(),
      activeClients: await prisma.client.count({ where: { isActive: true } }),
      conversations: await prisma.conversation.count(),
      settings: await prisma.systemSettings.count()
    }
    
    console.log('📊 Estado de la base de datos:')
    console.log(`  👥 Clientes totales: ${stats.clients}`)
    console.log(`  ✅ Clientes activos: ${stats.activeClients}`)
    console.log(`  💬 Conversaciones: ${stats.conversations}`)
    console.log(`  ⚙️ Configuraciones: ${stats.settings}`)
    
    return stats
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Función principal
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'init':
      await initializeDatabase()
      break
    case 'check':
      await checkDatabaseHealth()
      break
    case 'seed':
      await initializeDatabase()
      break
    default:
      console.log('🔧 Comandos disponibles:')
      console.log('  node scripts/init-database.js init   - Inicializar base de datos')
      console.log('  node scripts/init-database.js check  - Verificar estado')
      console.log('  node scripts/init-database.js seed   - Poblar con datos iniciales')
      break
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  initializeDatabase,
  checkDatabaseHealth,
  createDefaultSettings,
  createTestClient
}