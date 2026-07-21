// 데스크탑 전용 여닫는 옆 패널의 "틀"만 담당 (내용은 children으로 받음)
// open=false면 CSS(transform)로 화면 왼쪽 밖으로 슬라이드되어 숨겨짐
export default function SidePanel({ open, onToggle, children }) {
  return (
    <>
      <div className={`side-panel${open ? '' : ' side-panel--closed'}`}>
        <div className="side-panel-inner">{children}</div>
      </div>
      {/* 패널을 열고 닫는 동그란 토글 버튼 */}
      <button
        className={`panel-toggle${open ? '' : ' panel-toggle--closed'}`}
        onClick={onToggle}
        aria-label={open ? '패널 닫기' : '패널 열기'}
      >
        {open ? '‹' : '›'}
      </button>
    </>
  );
}
