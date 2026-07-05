import React from 'react';

/**
 * 하단 네비게이션 바
 * @param {string} currentPage - 현재 페이지
 * @param {function} navigateTo - 페이지 이동 헬퍼 (App.js에서 전달)
 */
export default function NavBar({ currentPage, navigateTo }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 grid grid-cols-4 items-center text-center text-xs text-gray-500 z-10 shadow-lg max-w-md mx-auto">
      <div
        onClick={() => navigateTo('main')}
        className={`cursor-pointer py-2 flex flex-col items-center ${currentPage === 'main' ? 'text-blue-600 font-bold' : ''}`}
      >
        <span>🏠</span><span className="mt-0.5">홈</span>
      </div>
      <div
        onClick={() => navigateTo('search')}
        className={`cursor-pointer py-2 flex flex-col items-center ${currentPage === 'search' ? 'text-blue-600 font-bold' : ''}`}
      >
        <span>🔍</span><span className="mt-0.5">검색</span>
      </div>
      <div
        onClick={() => navigateTo('create')}
        className={`cursor-pointer py-2 flex flex-col items-center ${currentPage === 'create' ? 'text-blue-600 font-bold' : ''}`}
      >
        <span>➕</span><span className="mt-0.5">만들기</span>
      </div>
      <div
        onClick={() => navigateTo('mypage')}
        className={`cursor-pointer py-2 flex flex-col items-center ${currentPage === 'mypage' ? 'text-blue-600 font-bold' : ''}`}
      >
        <span>👤</span><span className="mt-0.5">마이</span>
      </div>
    </div>
  );
}