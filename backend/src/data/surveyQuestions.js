// 투자 성향 설문 (10문항). 각 보기의 points 합산으로 분류.
// 총점 범위 10~40 → 5단계 분류는 classifyRisk() 참고.

export const SURVEY_QUESTIONS = [
  {
    id: 1,
    question: "투자 경험이 어느 정도인가요?",
    choices: [
      { label: "전혀 없다", points: 1 },
      { label: "예적금만 해봤다", points: 2 },
      { label: "주식/펀드를 해본 적 있다", points: 3 },
      { label: "코인/파생 등 다양하게 해봤다", points: 4 },
    ],
  },
  {
    id: 2,
    question: "투자한 자산이 한 달 만에 20% 하락했다면?",
    choices: [
      { label: "전부 팔고 다시는 안 한다", points: 1 },
      { label: "일부라도 팔아서 손실을 줄인다", points: 2 },
      { label: "회복할 때까지 기다린다", points: 3 },
      { label: "오히려 추가 매수를 고려한다", points: 4 },
    ],
  },
  {
    id: 3,
    question: "투자의 주된 목적은 무엇인가요?",
    choices: [
      { label: "원금을 지키면서 이자보다 조금 더", points: 1 },
      { label: "물가상승률 이상의 안정적 수익", points: 2 },
      { label: "자산을 적극적으로 불리기", points: 3 },
      { label: "짧은 기간에 높은 수익", points: 4 },
    ],
  },
  {
    id: 4,
    question: "예상 투자 기간은 어느 정도인가요?",
    choices: [
      { label: "6개월 미만", points: 1 },
      { label: "6개월 ~ 1년", points: 2 },
      { label: "1년 ~ 3년", points: 3 },
      { label: "3년 이상", points: 4 },
    ],
  },
  {
    id: 5,
    question: "전체 자산 중 투자에 쓸 수 있는 비중은?",
    choices: [
      { label: "10% 미만", points: 1 },
      { label: "10% ~ 30%", points: 2 },
      { label: "30% ~ 50%", points: 3 },
      { label: "50% 이상", points: 4 },
    ],
  },
  {
    id: 6,
    question: "다음 중 가장 끌리는 선택지는?",
    choices: [
      { label: "확정 연 4% 수익", points: 1 },
      { label: "손실 없이 0~10% 수익", points: 2 },
      { label: "-10% ~ +30% 가능성", points: 3 },
      { label: "-50% ~ +100% 가능성", points: 4 },
    ],
  },
  {
    id: 7,
    question: "투자 관련 뉴스나 정보를 얼마나 찾아보나요?",
    choices: [
      { label: "거의 안 본다", points: 1 },
      { label: "가끔 화제가 되면 본다", points: 2 },
      { label: "주 몇 회는 챙겨본다", points: 3 },
      { label: "매일 시황을 확인한다", points: 4 },
    ],
  },
  {
    id: 8,
    question: "소득 대비 투자 손실을 감당할 여력은?",
    choices: [
      { label: "손실이 나면 생활에 지장이 있다", points: 1 },
      { label: "약간의 손실까지는 괜찮다", points: 2 },
      { label: "일정 수준 손실은 감당 가능하다", points: 3 },
      { label: "큰 손실도 감당할 수 있다", points: 4 },
    ],
  },
  {
    id: 9,
    question: "잘 모르는 자산이 급등 중이라면?",
    choices: [
      { label: "관심 없다", points: 1 },
      { label: "지켜보기만 한다", points: 2 },
      { label: "공부해보고 소액 진입한다", points: 3 },
      { label: "일단 타고 본다", points: 4 },
    ],
  },
  {
    id: 10,
    question: "투자 결정을 내릴 때 나는?",
    choices: [
      { label: "원금 보장이 최우선이다", points: 1 },
      { label: "수익보다 안정성을 더 본다", points: 2 },
      { label: "안정성과 수익을 반반 본다", points: 3 },
      { label: "수익 기회가 보이면 리스크를 진다", points: 4 },
    ],
  },
];

export function classifyRisk(score) {
  if (score <= 16) return "안정형";
  if (score <= 22) return "안정추구형";
  if (score <= 28) return "위험중립형";
  if (score <= 34) return "적극투자형";
  return "공격투자형";
}

export function scoreAnswers(answers) {
  // answers: [{ qid, choice }] — choice는 보기 인덱스(0-base)
  let score = 0;
  for (const q of SURVEY_QUESTIONS) {
    const found = answers.find((a) => a.qid === q.id);
    if (!found || found.choice < 0 || found.choice >= q.choices.length) {
      throw new Error(`문항 ${q.id}의 답변이 없거나 잘못되었습니다`);
    }
    score += q.choices[found.choice].points;
  }
  return score;
}
