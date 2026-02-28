import { Bot, InlineKeyboard } from 'grammy'
import { prisma } from './db.js'

export async function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set, bot disabled')
    return
  }

  const bot = new Bot(token)
  const APP_URL = process.env.APP_URL || 'https://your-app-url.com'

  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    })

    if (!user) {
      await ctx.reply('👋 Привет!\n\nВас нет в системе PrintTrack.\nОбратитесь к администратору.')
      return
    }

    const keyboard = new InlineKeyboard().webApp('📋 Открыть PrintTrack', APP_URL)
    await ctx.reply(
      `👋 Привет, ${user.firstName}!\n\nДобро пожаловать в PrintTrack.`,
      { reply_markup: keyboard }
    )
  })

  bot.command('adduser', async (ctx) => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    const requester = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    })

    if (!requester || !['ADMIN', 'MANAGER'].includes(requester.role)) {
      await ctx.reply('❌ У вас нет прав для этой команды.')
      return
    }

    const args = (ctx.match as string)?.split(' ') || []
    if (args.length < 2) {
      await ctx.reply('Использование: /adduser <telegram_id> <имя> [WORKER|MANAGER]')
      return
    }

    const [newTelegramId, firstName, role = 'WORKER'] = args
    const assignedRole = requester.role === 'MANAGER' ? 'WORKER' : role

    try {
      await prisma.user.create({
        data: {
          telegramId: BigInt(newTelegramId),
          firstName,
          role: assignedRole as any,
          addedBy: requester.id,
        },
      })
      await ctx.reply(`✅ Пользователь ${firstName} добавлен с ролью ${assignedRole}`)
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'P2002') {
        await ctx.reply('⚠️ Пользователь уже существует.')
      } else {
        await ctx.reply('❌ Ошибка при добавлении.')
      }
    }
  })

  bot.command('addadmin', async (ctx) => {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount > 0) {
      await ctx.reply('❌ Уже есть администраторы. Используйте /adduser.')
      return
    }

    const telegramId = ctx.from?.id
    const firstName = ctx.from?.first_name
    const username = ctx.from?.username
    if (!telegramId || !firstName) return

    await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      create: { telegramId: BigInt(telegramId), firstName, username, role: 'ADMIN' },
      update: { role: 'ADMIN' },
    })

    await ctx.reply('✅ Вы назначены администратором системы PrintTrack!')
  })

  bot.start()
  return bot
}
