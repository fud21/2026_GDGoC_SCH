export default function SidePanel({ open, onToggle, children }) {
  return (
    <>
      <div className={`side-panel${open ? '' : ' side-panel--closed'}`}>
        <div className="side-panel-inner">{children}</div>
      </div>
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
