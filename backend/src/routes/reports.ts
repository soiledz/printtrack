import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

export async function reportsRoutes(app: FastifyInstance) {
  app.get('/efficiency', { onRequest: [app.authenticate] }, async (request) => {
    const { userId: currentUserId, role } = request.user as { userId: number; role: string }
    const { userId, from, to } = request.query as { userId?: string; from?: string; to?: string }

    const targetUserId = ['ADMIN', 'MANAGER'].includes(role) && userId
      ? Number(userId)
      : currentUserId

    const tasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        workDay: {
          userId: targetUserId,
          date: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
      },
      include: {
        operations: { include: { norm: true } },
        workDay: { select: { date: true } },
      },
      orderBy: { completedAt: 'desc' },
    })

    const avgEfficiency = tasks.length > 0
      ? tasks.reduce((sum: number, t: typeof tasks[0]) => sum + (t.efficiency ?? 0), 0) / tasks.length
      : 0

    return {
      tasks: tasks.map((t: typeof tasks[0]) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        date: t.workDay.date,
        efficiency: t.efficiency,
        totalMinutes: t.totalMinutes,
        normMinutes: t.normMinutes,
      })),
      summary: {
        totalTasks: tasks.length,
        avgEfficiency: Math.round(avgEfficiency),
      },
    }
  })
}
