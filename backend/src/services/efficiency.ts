// backend/src/services/efficiency.ts

interface OperationWithNorm {
  durationSec: number | null
  type: string
  impressions: number | null
  norm: {
    normSeconds: number
    perUnit: number | null
  } | null
}

export function calculateEfficiency(operations: OperationWithNorm[]) {
  let totalSec = 0
  let normTotalSec = 0

  for (const op of operations) {
    if (!op.durationSec || !op.norm) continue

    totalSec += op.durationSec

    let expectedSec = op.norm.normSeconds
    // Для операций с единицами (например печать: норма на 100 оттисков)
    if (op.norm.perUnit && op.impressions) {
      expectedSec = (op.impressions / op.norm.perUnit) * op.norm.normSeconds
    }

    normTotalSec += expectedSec
  }

  const totalMinutes = Math.round(totalSec / 60)
  const normMinutes = Math.round(normTotalSec / 60)
  
  // efficiency: 100% = норма выполнена точно
  // > 100% = быстрее нормы (хорошо), < 100% = медленнее нормы
  const efficiency = normTotalSec > 0
    ? Math.round((normTotalSec / totalSec) * 100)
    : 0

  return { totalMinutes, normMinutes, efficiency }
}
