# WhatsApp Business Advisor 🚀

Sistema completo de asesoría empresarial a través de WhatsApp con panel de administración profesional.

## 🌟 Características Principales

- **🤖 Bot de WhatsApp Inteligente** - Integración con Baileys para comunicación directa
- **🧠 IA Especializada** - Gemini AI con base de conocimiento empresarial extenso
- **👥 Gestión de Clientes** - Panel profesional para administrar suscripciones
- **📊 Dashboard Analytics** - Métricas y estadísticas en tiempo real
- **🔔 Notificaciones Automáticas** - Alertas de vencimiento por WhatsApp
- **🛡️ Seguridad Avanzada** - Autenticación JWT y control de acceso
- **🚀 Production Ready** - Configurado para despliegue en Render.com

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** + TypeScript
- **Tailwind CSS** + Shadcn/ui  
- **Socket.IO** para tiempo real
- **React Hook Form** para formularios

### Backend
- **Node.js** + Express
- **Prisma ORM** + PostgreSQL
- **Baileys** para WhatsApp Web
- **Winston** para logging estructurado
- **JWT** para autenticación segura

### Inteligencia Artificial
- **Google Gemini AI** (Pool de 15 APIs)
- **Rotación automática** de APIs
- **Sistema de personalidad adaptativa**
- **Verificador de hechos legales**
- **Base de conocimiento especializada**

## 🚀 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone https://github.com/Agente092/Azezor-Agentz.git
cd Azezor-Agentz

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Configurar base de datos
npx prisma generate
npx prisma db push

# 5. Iniciar desarrollo (DOS terminales)
npm run dev        # Frontend (puerto 3000)
npm run dev:server # Backend (puerto 3001)
```

## 📱 Configuración WhatsApp

1. **Iniciar backend**: `npm run dev:server`
2. **Acceder al panel**: `http://localhost:3000`
3. **Conectar WhatsApp**: Ir a sección "Bot"
4. **Escanear QR**: Con WhatsApp Web
5. **¡Listo!**: Bot conectado y funcionando

## 🌐 Despliegue en Producción

**✅ COMPLETAMENTE LISTO PARA RENDER.COM**

Archivos de configuración incluidos:
- ⚙️ `render.yaml` - Configuración automática
- 🐳 `Dockerfile` - Contenedorización
- 📦 Scripts de producción en `package.json`
- 🔐 Variables de entorno documentadas
- 🗄️ PostgreSQL configurado y listo

**Documentación completa:**
- 📖 `DEPLOY-RENDER.md` - Guía paso a paso
- ✅ `DEPLOYMENT-CHECKLIST.md` - Lista de verificación

## 🎯 Credenciales Por Defecto

```
Email: admin@advisor.com
Password: admin123
```

## 🏢 Especialización Empresarial

Base de conocimiento enfocada en asesoría empresarial peruana:

- **💰 Estrategias Fiscales** - Optimización tributaria legal
- **🏢 Estructuras Empresariales** - Holdings, operadoras, offshore  
- **🏠 Inversiones Inmobiliarias** - BRRRR, Rent to Rent, estrategias avanzadas
- **🛡️ Protección Patrimonial** - Fideicomisos, blindaje de activos
- **⚖️ Aspectos Legales** - Normativas peruanas, tipos de empresas
- **🔍 Trucos Fiscales** - Estrategias ocultas y combinaciones

## 📊 Funcionalidades Avanzadas

### 🎯 Sistema de Clientes Inteligente
- ✅ Gestión automática de suscripciones
- ✅ Seguimiento de actividad por cliente
- ✅ Notificaciones automáticas de vencimiento
- ✅ Control de acceso dinámico al bot

### 🤖 Bot con IA Especializada
- ✅ Respuestas contextuales especializadas
- ✅ Reconocimiento de intención empresarial
- ✅ Sistema de memoria conversacional
- ✅ Personalidad adaptativa por tipo de cliente

### 📈 Panel de Administración Profesional
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión visual e intuitiva de clientes
- ✅ Monitoreo del estado del bot
- ✅ Logs detallados y estadísticas

### 🔧 Arquitectura Robusta
- ✅ Pool de 15 APIs de Gemini con rotación
- ✅ Sistema de backups de sesiones WhatsApp
- ✅ Logging estructurado con Winston
- ✅ Health checks para monitoreo

## 🚨 Solución de Problemas

### Bot no conecta WhatsApp
```bash
# Limpiar sesión y reiniciar
rm -rf auth_info_baileys/*
npm run dev:server
```

### Error de base de datos
```bash
# Verificar y aplicar schema
npx prisma db push
npx prisma generate
```

### Límites de API alcanzados
- El sistema automáticamente rota entre 15 APIs
- Monitorea uso en `/api/pool/stats`

## 📞 Soporte y Monitoreo

**URLs importantes:**
- 🏠 **App**: `http://localhost:3000`
- ❤️ **Health**: `http://localhost:3001/health`
- 📊 **Stats**: `http://localhost:3001/api/pool/stats`

**Verificaciones:**
- 📧 Revisar logs en consola
- 🔧 Verificar variables de entorno
- 🔄 Reiniciar servicios si es necesario

---

## 🎉 ¡Sistema Empresarial Listo!

Tu plataforma de asesoría empresarial automatizada está completamente preparada para:

- **Atender clientes 24/7** con IA especializada
- **Gestionar suscripciones** automáticamente  
- **Brindar asesoría fiscal** especializada en Perú
- **Escalar tu negocio** sin límites técnicos

**🚀 ¡Despliega hoy y comienza a revolucionar la asesoría empresarial!**