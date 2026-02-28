// prisma/seed.ts
import { PrismaClient, OperationType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding operation norms...')

  const norms = [
    {
      type: OperationType.EMULSION_POUR,
      label: 'Поливка эмульсией',
      normSeconds: 600,      // 10 минут
      description: 'Нанесение эмульсии на сетку',
    },
    {
      type: OperationType.EXPOSURE,
      label: 'Засветка',
      normSeconds: 180,      // 3 минуты
      description: 'Засветка УФ-излучением',
    },
    {
      type: OperationType.DRYING,
      label: 'Просушка',
      normSeconds: 1200,     // 20 минут
      description: 'Просушка после поливки (опционально)',
    },
    {
      type: OperationType.FIXING,
      label: 'Закрепление',
      normSeconds: 300,      // 5 минут
      description: 'Закрепление эмульсии (опционально)',
    },
    {
      type: OperationType.SETUP_SEMIAUTO,
      label: 'Настройка (полуавтомат)',
      normSeconds: 900,      // 15 минут
      description: 'Настройка полуавтоматического станка',
    },
    {
      type: OperationType.SETUP_MANUAL,
      label: 'Настройка (ручная)',
      normSeconds: 600,      // 10 минут
      description: 'Ручная настройка',
    },
    {
      type: OperationType.PRINTING,
      label: 'Печать',
      normSeconds: 36,       // 36 сек на 100 оттисков = 0.36 сек/оттиск
      perUnit: 100,
      unitLabel: 'оттисков',
      description: 'Норма на 100 оттисков',
    },
    {
      type: OperationType.WASHING,
      label: 'Замывка',
      normSeconds: 300,      // 5 минут
      description: 'Замывка после печати',
    },
    {
      type: OperationType.INK_MIXING,
      label: 'Замес краски',
      normSeconds: 600,      // 10 минут
      description: 'Приготовление краски',
    },
    {
      type: OperationType.SCREEN_WASHING,
      label: 'Смывка печатной формы',
      normSeconds: 480,      // 8 минут
      description: 'Смывка сетки после работы',
    },
  ]

  for (const norm of norms) {
    await prisma.operationNorm.upsert({
      where: { type: norm.type },
      update: norm,
      create: norm,
    })
    console.log(`  ✓ ${norm.label}`)
  }

  // Создать первого админа (опционально — через бота)
  console.log('\n✅ Seed complete!')
  console.log('💡 Добавьте первого ADMIN через команду бота /addadmin <telegram_id>')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
