import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

export async function normsRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [app.authenticate] }, async () => {
    return prisma.operationNorm.findMany({ orderBy: { type: 'asc' } })
  })

  app.put('/:type', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { role } = request.user as { role: string }
    if (!['ADMIN', 'MANAGER'].includes(role)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
    const { type } = request.params as { type: string }
    const { normSeconds, description } = request.body as { normSeconds: number; description?: string }
    return prisma.operationNorm.update({
      where: { type: type as any },
      data: { normSeconds, description },
    })
  })
}
