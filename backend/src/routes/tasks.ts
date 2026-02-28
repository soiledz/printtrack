import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { calculateEfficiency } from '../services/efficiency.js'

export async function taskRoutes(app: FastifyInstance) {
  // GET /api/tasks/:id — одно задание
  app.get('/:id', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { id } = request.params as { id: string }
    const task = await prisma.task.findFirst({
      where: { id: Number(id), workDay: { userId } },
      include: { operations: { include: { norm: true }, orderBy: { id: 'asc' } } },
    })
    if (!task) return reply.status(404).send({ error: 'Not found' })
    return task
  })

  // GET /api/tasks?workDayId=1
  app.get('/', { onRequest: [app.authenticate] }, async (request) => {
    const { userId } = request.user as { userId: number }
    const { workDayId } = request.query as { workDayId: string }

    return prisma.task.findMany({
      where: { workDayId: Number(workDayId), workDay: { userId } },
      include: { operations: { include: { norm: true }, orderBy: { id: 'asc' } } },
      orderBy: { startedAt: 'asc' },
    })
  })

  // POST /api/tasks
  app.post('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { workDayId, taskNumber, description } = request.body as {
      workDayId: number; taskNumber: string; description?: string
    }

    const workDay = await prisma.workDay.findFirst({
      where: { id: Number(workDayId), userId },
    })
    if (!workDay) return reply.status(404).send({ error: 'WorkDay not found' })

    return prisma.task.create({
      data: { workDayId: Number(workDayId), taskNumber, description, startedAt: new Date() },
    })
  })

  // PUT /api/tasks/:id/complete
  app.put('/:id/complete', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { id } = request.params as { id: string }
    const { comment } = request.body as { comment?: string }

    const task = await prisma.task.findFirst({
      where: { id: Number(id), workDay: { userId } },
      include: { operations: { include: { norm: true } } },
    })
    if (!task) return reply.status(404).send({ error: 'Not found' })

    const { totalMinutes, normMinutes, efficiency } = calculateEfficiency(task.operations)

    if (comment && task.operations.length > 0) {
      const lastOp = task.operations[task.operations.length - 1]
      await prisma.operation.update({
        where: { id: lastOp.id },
        data: { comment },
      })
    }

    return prisma.task.update({
      where: { id: Number(id) },
      data: { status: 'COMPLETED', completedAt: new Date(), totalMinutes, normMinutes, efficiency },
      include: { operations: true },
    })
  })
}
