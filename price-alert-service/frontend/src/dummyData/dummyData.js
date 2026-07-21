// ============================================================
//  [더미(가짜) 데이터 파일]   ⚠️ 나중에 삭제하세요 ⚠️
//
//  백엔드가 아직 없어서, 앱을 미리 작동시켜 보기 위한 임시 데이터입니다.
//  백엔드 API가 완성되면:
//   1) [백엔드 ①]~[백엔드 ⑧] 주석을 풀고 서버 주소만 넣고
//   2) '// 더미: 연동 시 삭제'라고 적힌 줄을 모두 지우고
//   3) 이 파일(dummyData.js)을 통째로 삭제하면 됩니다.
//
//  - 가격은 숫자로 저장하고, 화면에서 '239,000원'처럼 바꿔서 보여줍니다.
//  - imageUrl 은 지금은 임시(샘플) 이미지 주소입니다.
//  - priceHistory 는 그래프에 쓰는 가격 변동 기록입니다.
// ============================================================

// 이미 등록되어 있는 관심 상품 목록 (홈·관심상품·마이페이지가 함께 사용)
// isAlertOn: 종 아이콘의 알림 켜짐/꺼짐 상태 (홈과 관심상품이 같은 값을 함께 씀)
export const DUMMY_WATCHED_PRODUCTS = [
  {
    id: 1,
    name: 'Apple 에어팟 프로 2세대',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/airpods/160/160',
    currentLowestPrice: 239000,
    targetPrice: 200000,
    status: '가격 하락',
    isAlertOn: true,
    priceHistory: [258000, 254000, 249000, 245000, 242000, 239000],
  },
  {
    id: 2,
    name: '삼성 갤럭시 워치6 40mm',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/galaxywatch/160/160',
    currentLowestPrice: 219000,
    targetPrice: 200000,
    status: '목표가 임박',
    isAlertOn: true,
    priceHistory: [235000, 232000, 228000, 225000, 221000, 219000],
  },
  {
    id: 3,
    name: '닌텐도 스위치 OLED',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/switch/160/160',
    currentLowestPrice: 349000,
    targetPrice: 350000,
    status: '목표가 도달',
    isAlertOn: true,
    priceHistory: [360000, 358000, 355000, 352000, 350000, 349000],
  },
  {
    id: 4,
    name: '로지텍 MX Master 3S',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/mxmaster/160/160',
    currentLowestPrice: 134000,
    targetPrice: 120000,
    status: '가격 하락',
    isAlertOn: true,
    priceHistory: [145000, 142000, 139000, 137000, 135000, 134000],
  },
];

// 알림 내역 (마이페이지의 '받은 알림' 수도 이 목록의 길이로 셈)
export const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    productName: 'Apple 에어팟 프로 2세대',
    message: '가격이 목표가 200,000원 이하로 떨어졌어요!',
    time: '오늘 오전 9:30',
    isRead: false,
    type: '가격 하락',
    section: '오늘',
  },
  {
    id: 2,
    productName: '삼성 갤럭시 워치6 40mm',
    message: '가격이 목표가 200,000원 이하로 떨어졌어요!',
    time: '오늘 오전 8:15',
    isRead: false,
    type: '가격 하락',
    section: '오늘',
  },
  {
    id: 3,
    productName: '닌텐도 스위치 OLED',
    message: '목표가 350,000원에 도달했어요!',
    time: '오늘 오전 7:02',
    isRead: true,
    type: '목표가 도달',
    section: '오늘',
  },
  {
    id: 4,
    productName: 'Apple 아이패드 에어 64GB',
    message: '가격이 목표가 580,000원 이하로 떨어졌어요!',
    time: '6월 10일 오후 4:25',
    isRead: true,
    type: '가격 하락',
    section: '이번 주',
  },
  {
    id: 5,
    productName: 'Sony WH-1000XM5',
    message: '가격이 목표가 320,000원 이하로 떨어졌어요!',
    time: '6월 9일 오전 11:48',
    isRead: true,
    type: '가격 하락',
    section: '이번 주',
  },
];

// 검색 화면에서 검색해서 등록할 수 있는 상품 목록 (백엔드의 상품 검색 결과 역할)
export const DUMMY_SEARCH_CATALOG = [
  {
    id: 1,
    name: 'Apple 에어팟 프로 2세대',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/airpods/160/160',
    currentLowestPrice: 239000,
    priceHistory: [258000, 254000, 249000, 245000, 242000, 239000],
  },
  {
    id: 2,
    name: '삼성 갤럭시 워치6 40mm',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/galaxywatch/160/160',
    currentLowestPrice: 219000,
    priceHistory: [235000, 232000, 228000, 225000, 221000, 219000],
  },
  {
    id: 3,
    name: '닌텐도 스위치 OLED',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/switch/160/160',
    currentLowestPrice: 349000,
    priceHistory: [360000, 358000, 355000, 352000, 350000, 349000],
  },
  {
    id: 4,
    name: '로지텍 MX Master 3S',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/mxmaster/160/160',
    currentLowestPrice: 134000,
    priceHistory: [145000, 142000, 139000, 137000, 135000, 134000],
  },
  {
    id: 5,
    name: 'Apple 아이패드 에어 64GB',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/ipadair/160/160',
    currentLowestPrice: 579000,
    priceHistory: [620000, 610000, 600000, 595000, 585000, 579000],
  },
  {
    id: 6,
    name: 'Sony WH-1000XM5',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/sonyxm5/160/160',
    currentLowestPrice: 319000,
    priceHistory: [399000, 389000, 369000, 349000, 329000, 319000],
  },
  {
    id: 7,
    name: 'LG 울트라기어 27GP850',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/lgmonitor/160/160',
    currentLowestPrice: 449000,
    priceHistory: [470000, 465000, 460000, 455000, 452000, 449000],
  },
  {
    id: 8,
    name: '다이슨 V12 Detect Slim',
    mall: '쿠팡',
    imageUrl: 'https://picsum.photos/seed/dyson/160/160',
    currentLowestPrice: 649000,
    priceHistory: [699000, 689000, 679000, 669000, 659000, 649000],
  },
];

// 검색 화면 - 인기 검색어
export const DUMMY_POPULAR_KEYWORDS = ['에어팟', '워치', '스위치', '아이패드', '소니', '다이슨'];

// 마이페이지 - 내 정보 (관심 상품 개수 등은 실제 목록에서 계산함)
export const DUMMY_MY_PROFILE = {
  username: 'username',
  email: 'user@email.com',
};
