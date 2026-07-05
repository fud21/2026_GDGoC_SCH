import React from 'react';
import StudyCard from '../components/StudyCard';

export default function SearchPage({
  studies,
  searchKeyword,
  setSearchKeyword,
  handleSearchSubmit,
  sortOrder,
  setSortOrder,
  statusFilter,
  setStatusFilter,
  viewStudyDetail,
  setCurrentPage,
}) {
  return (
    <div className="flex-1 pb-20">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <button onClick={() => setCurrentPage('main')} className="text-lg">←</button>
          <h1 className="text-md font-bold">스터디 검색</h1>
        </div>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="과목, 키워드 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full bg-gray-100 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </form>
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-transparent font-medium border-none focus:outline-none"
          >
            <option>최신순</option>
            <option>시간순</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent font-medium border-none focus:outline-none"
          >
            <option value="전체">모집 상태</option>
            <option value="모집중">모집중</option>
            <option value="마감">마감</option>
          </select>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {studies.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">조건에 맞는 스터디가 없습니다.</div>
        ) : (
          studies.map((study) => (
            <StudyCard key={study.id} study={study} onClick={viewStudyDetail} variant="search" />
          ))
        )}
      </div>
    </div>
  );
}
