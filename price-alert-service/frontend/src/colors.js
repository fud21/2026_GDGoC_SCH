// 앱 전체에서 쓰는 색을 모아둔 파일입니다. (여기만 고치면 앱 전체에 적용됨)
//
// [색 규칙]
// 화면은 흰색·회색·검정으로만 만들고, 빨강은 '가격'에 관한 강조에만 씁니다.
// (가격 하락률, 목표가 도달) 색을 아껴 쓸수록 중요한 정보가 눈에 잘 띕니다.

// 글자 색 (진할수록 중요한 글자)
export const TEXT = {
  STRONG: '#111111', // 제목, 가격
  DEFAULT: '#333333', // 본문, 상품 이름
  SUB: '#767676', // 보조 설명
  WEAK: '#B0B0B0', // 흐린 글자, 입력 안내 문구
  INVERSE: '#FFFFFF', // 어두운 바탕 위의 글자
};

// 선 색
export const LINE = {
  DEFAULT: '#EEEEEE', // 목록을 나누는 얇은 선
  STRONG: '#DDDDDD', // 입력칸 밑줄, 버튼 테두리
};

// 면 색
export const SURFACE = {
  WHITE: '#FFFFFF', // 화면 바탕
  GRAY: '#F7F7F7', // 검색창·이미지 자리 바탕
  BAND: '#F4F4F4', // 구역과 구역 사이를 나누는 굵은 띠
};

// 포인트 색 (딱 하나. 가격 하락률·목표가 도달에만 씁니다)
export const POINT = {
  DEFAULT: '#E8272C', // 강조 빨강
};

// 주요 버튼 색 (로그인·등록하기 같은 큰 검정 버튼)
export const BUTTON = {
  DEFAULT: '#111111',
};
