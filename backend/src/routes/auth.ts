import { FastifyInstance } from 'fastify'
import { createHmac } from 'crypto'
import { prisma } from '../db.js'

function validateTelegramData(initData: string): Record<string, string> | null {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN || '')
    .digest()

  const expectedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  if (expectedHash !== hash) return null

  const result: Record<string, string> = {}
  params.forEach((v, k) => { result[k] = v })
  return result
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/verify', async (request, reply) => {
    const { initData } = request.body as { initData: string }
    if (!initData) return reply.status(400).send({ error: 'initData required' })

    let userData: Record<string, string> | null = null

    if (process.env.NODE_ENV === 'development' && initData.startsWith('dev:')) {
      userData = { user: initData.replace('dev:', '') }
    } else {
      userData = validateTelegramData(initData)
    }

    if (!userData) return reply.status(401).send({ error: 'Invalid Telegram data' })

    let tgUser: { id: number; first_name: string; username?: string; last_name?: string }
    try {
      tgUser = JSON.parse(userData['user'])
    } catch {
      return reply.status(400).send({ error: 'Invalid user data' })
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(tgUser.id) },
    })

    if (!user) {
      return reply.status(403).send({
        error: 'Access denied',
        message: 'Вас нет в системе. Обратитесь к администратору.',
      })
    }

    if (!user.isActive) return reply.status(403).send({ error: 'Account disabled' })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
      },
    })

    const token = app.jwt.sign(
      { userId: user.id, telegramId: String(user.telegramId), role: user.role },
      { expiresIn: '7d' }
    )

    return {
      token,
      user: {
        id: user.id,
        telegramId: String(user.telegramId),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  })
}
