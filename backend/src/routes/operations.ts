import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

export async function operationRoutes(app: FastifyInstance) {
  app.post('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { taskId, type, isOptional } = request.body as { taskId: number; type: string; isOptional?: boolean }

    const task = await prisma.task.findFirst({
      where: { id: Number(taskId), workDay: { userId } },
    })
    if (!task) return reply.status(404).send({ error: 'Task not found' })

    return prisma.operation.create({
      data: {
        taskId: Number(taskId),
        type: type as any,
        isOptional: Boolean(isOptional),
        startedAt: new Date(),
      },
      include: { norm: true },
    })
  })

  app.put('/:id/stop', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { id } = request.params as { id: string }
    const { impressions, comment } = request.body as { impressions?: number; comment?: string }

    const op = await prisma.operation.findFirst({
      where: { id: Number(id), task: { workDay: { userId } } },
    })
    if (!op) return reply.status(404).send({ error: 'Not found' })
    if (!op.startedAt) return reply.status(400).send({ error: 'Not started' })

    const completedAt = new Date()
    const durationSec = Math.round((completedAt.getTime() - op.startedAt.getTime()) / 1000)

    return prisma.operation.update({
      where: { id: Number(id) },
      data: {
        completedAt,
        durationSec,
        impressions: impressions ? Number(impressions) : undefined,
        comment,
      },
      include: { norm: true },
    })
  })
}
