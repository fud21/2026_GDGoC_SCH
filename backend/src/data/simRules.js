// 레벨별 시뮬레이션 규칙 (docs/PLAN.md 2.3장)

export const TRADE_FEE_RATE = 0.0005; // 업비트 KRW 마켓 수수료 0.05%

export function seedMoneyForLevel(level) {
  if (level >= 5) return 10_000_000;
  if (level >= 3) return 5_000_000;
  return 1_000_000;
}

export function allowedOrderTypes(level) {
  return level >= 3 ? ["MARKET", "LIMIT"] : ["MARKET"];
}

export function simRulesForLevel(level) {
  return {
    seedMoney: seedMoneyForLevel(level),
    orderTypes: allowedOrderTypes(level),
    feeRate: TRADE_FEE_RATE,
  };
}
