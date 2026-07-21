// 가격 관련 도우미 함수들

// 숫자를 '239,000원'처럼 세 자리마다 콤마를 찍어 표시
export function formatPrice(number) {
  const text = String(number);
  let result = '';
  let count = 0;

  // 뒤에서부터 한 글자씩 붙이면서 세 자리마다 콤마를 넣음
  for (let i = text.length - 1; i >= 0; i = i - 1) {
    result = text[i] + result;
    count = count + 1;
    if (count % 3 === 0 && i !== 0) {
      result = ',' + result;
    }
  }

  return result + '원';
}

// '200,000' 같은 글자에서 숫자만 뽑아 정수로 바꿈
export function parsePrice(text) {
  let digitsOnly = '';

  // 0~9 사이의 글자만 골라 이어붙임
  for (let i = 0; i < text.length; i = i + 1) {
    const oneChar = text[i];
    if (oneChar >= '0' && oneChar <= '9') {
      digitsOnly = digitsOnly + oneChar;
    }
  }

  if (digitsOnly === '') {
    return 0;
  }
  return Number(digitsOnly);
}

// 처음 가격보다 지금 몇 % 내렸는지를 구함 (내리지 않았으면 0)
export function calculateDropRate(priceHistory, currentLowestPrice) {
  // 기록이 2개보다 적으면 비교할 대상이 없음
  if (priceHistory.length < 2) {
    return 0;
  }

  const firstPrice = priceHistory[0];

  // 가격이 오히려 오르거나 그대로면 하락률은 0
  if (firstPrice <= 0 || currentLowestPrice >= firstPrice) {
    return 0;
  }

  const dropRate = ((firstPrice - currentLowestPrice) / firstPrice) * 100;
  return Math.round(dropRate);
}

// 현재 최저가 · 목표가 · 가격 기록으로 상품 상태를 정함
export function decideStatus(priceHistory, currentLowestPrice, targetPrice) {
  // 최저가가 목표가 이하이면 '목표가 도달'
  if (currentLowestPrice <= targetPrice) {
    return '목표가 도달';
  }

  // 목표가보다 10% 이내로 가까우면 '목표가 임박'
  if (currentLowestPrice <= targetPrice * 1.1) {
    return '목표가 임박';
  }

  // 가격 기록의 마지막 값이 처음 값보다 낮으면 '가격 하락'
  if (priceHistory.length >= 2) {
    const firstPrice = priceHistory[0];
    const lastPrice = priceHistory[priceHistory.length - 1];
    if (lastPrice < firstPrice) {
      return '가격 하락';
    }
  }

  return '유지 중';
}
