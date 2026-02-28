import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

export async function calendarRoutes(app: FastifyInstance) {
  app.get('/:year/:month', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { year, month } = request.params as { year: string; month: string }

    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0)

    const workDays = await prisma.workDay.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      include: { _count: { select: { tasks: true } } },
    })

    return workDays.map((d) => ({
      id: d.id,
      date: d.date,
      type: d.type,
      startedAt: d.startedAt,
      endedAt: d.endedAt,
      tasksCount: d._count.tasks,
    }))
  })

  app.post('/day', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { date, type } = request.body as { date: string; type: 'WORK' | 'DAY_OFF' }

    const dayDate = new Date(date)

    const workDay = await prisma.workDay.upsert({
      where: { userId_date: { userId, date: dayDate } },
      create: {
        userId,
        date: dayDate,
        type,
        startedAt: type === 'WORK' ? new Date() : null,
      },
      update: {
        type,
        startedAt: type === 'WORK' ? new Date() : null,
      },
    })

    return workDay
  })

  app.put('/day/:id/end', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user as { userId: number }
    const { id } = request.params as { id: string }

    const workDay = await prisma.workDay.findFirst({
      where: { id: Number(id), userId },
    })
    if (!workDay) return reply.status(404).send({ error: 'Not found' })

    return prisma.workDay.update({
      where: { id: Number(id) },
      data: { endedAt: new Date() },
    })
  })
}
