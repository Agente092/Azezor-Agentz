#!/usr/bin/env node

/**
 * Script de inicialización para Render
 * Configura la base de datos y datos iniciales
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function initializeDatabase() {
  const prisma = new PrismaClient()

  try {
    console.log('🚀 Inicializando base de datos...')

    // Verificar conexión
    await prisma.$connect()
    console.log('✅ Conexión a base de datos establecida')

    // Sincronizar esquema (equivalente a prisma db push)
    console.log('📊 Aplicando migraciones...')
    // En producción, Render ejecutará: npx prisma db push

    // Crear usuario administrador si no existe
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@advisor.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN'
        }
      })
      console.log(`✅ Usuario administrador creado: ${adminEmail}`)
    } else {
      console.log('ℹ️ Usuario administrador ya existe')
    }

    console.log('🎉 Base de datos inicializada correctamente')

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase }