import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/me', { onRequest: [app.authenticate] }, async (request) => {
    const { userId } = request.user as { userId: number }
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, telegramId: true, username: true, firstName: true, lastName: true, role: true, isActive: true },
    })
  })

  app.get('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { role } = request.user as { role: string }
    if (!['ADMIN', 'MANAGER'].includes(role)) return reply.status(403).send({ error: 'Forbidden' })

    return prisma.user.findMany({
      select: { id: true, telegramId: true, username: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { userId, role } = request.user as { userId: number; role: string }
    if (!['ADMIN', 'MANAGER'].includes(role)) return reply.status(403).send({ error: 'Forbidden' })

    const { telegramId, firstName, lastName, username, userRole } = request.body as {
      telegramId: string; firstName: string; lastName?: string; username?: string; userRole?: string
    }

    const assignedRole = role === 'MANAGER' ? 'WORKER' : (userRole || 'WORKER')

    return prisma.user.create({
      data: {
        telegramId: BigInt(telegramId),
        firstName,
        lastName,
        username,
        role: assignedRole as any,
        addedBy: userId,
      },
    })
  })

  app.put('/:id', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { role } = request.user as { role: string }
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' })

    const { id } = request.params as { id: string }
    const { userRole, isActive } = request.body as { userRole?: string; isActive?: boolean }

    return prisma.user.update({
      where: { id: Number(id) },
      data: { role: userRole as any, isActive },
    })
  })
}
