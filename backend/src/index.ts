import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth.js'
import { calendarRoutes } from './routes/calendar.js'
import { taskRoutes } from './routes/tasks.js'
import { operationRoutes } from './routes/operations.js'
import { normsRoutes } from './routes/norms.js'
import { usersRoutes } from './routes/users.js'
import { reportsRoutes } from './routes/reports.js'
import { startBot } from './bot.js'

async function main() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true, credentials: true })
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-this-secret',
  })

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(calendarRoutes, { prefix: '/api/calendar' })
  await app.register(taskRoutes, { prefix: '/api/tasks' })
  await app.register(operationRoutes, { prefix: '/api/operations' })
  await app.register(normsRoutes, { prefix: '/api/norms' })
  await app.register(usersRoutes, { prefix: '/api/users' })
  await app.register(reportsRoutes, { prefix: '/api/reports' })

  app.get('/health', async () => ({ status: 'ok', ts: new Date() }))

  const PORT = Number(process.env.PORT) || 3001
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`🚀 API running on http://localhost:${PORT}`)
    await startBot()
    console.log('🤖 Bot started')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
