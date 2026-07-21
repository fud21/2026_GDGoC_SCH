"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type Tool = "inspect" | "levee" | "excavation" | "culvert" | "blockage";

type Intervention = {
  id: string;
  type: Exclude<Tool, "inspect">;
  x: number;
  y: number;
};

type Cell = {
  x: number;
  y: number;
  elevation: number;
  depth: number;
  arrival: number;
};

type SimulationResult = {
  cells: Cell[];
  grid: { width: number; height: number; cellMeters: number };
  metrics: {
    maxDepth: number;
    floodedArea: number;
    affectedBuildings: number;
    exposedRoads: number;
    firstArrivalMinutes: number;
    riskScore: number;
    estimatedDamage: number;
  };
  comparison: {
    baselineRisk: number;
    deltaRisk: number;
    baselineDamage: number;
    deltaDamage: number;
  };
  model: string;
};

const DEFAULT_INTERVENTIONS: Intervention[] = [
  { id: "construction-sample", type: "blockage", x: 18, y: 11 },
];

const TOOLS: { id: Tool; label: string; mark: string; description: string }[] = [
  { id: "inspect", label: "조회", mark: "⌖", description: "셀 위험 조회" },
  { id: "levee", label: "제방", mark: "▰", description: "방어선 설치" },
  { id: "excavation", label: "굴착", mark: "▽", description: "하도 확장" },
  { id: "culvert", label: "배수", mark: "◎", description: "배수구 추가" },
  { id: "blockage", label: "공사", mark: "×", description: "통수 단면 차단" },
];

const BUILDINGS = [
  [4, 3, 22], [7, 4, 30], [10, 3, 19], [14, 4, 38], [18, 3, 24],
  [22, 4, 31], [27, 3, 23], [3, 8, 25], [7, 8, 34], [12, 7, 20],
  [17, 8, 42], [23, 7, 28], [28, 8, 21], [5, 16, 24], [9, 18, 35],
  [15, 17, 27], [20, 18, 44], [25, 16, 26], [29, 18, 32],
] as const;

const canvasWidth = 1100;
const canvasHeight = 600;
const cellWidth = 32;
const cellHeight = 16;
const originX = 540;
const originY = 70;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const project = (x: number, y: number) => ({
  x: originX + (x - y) * (cellWidth / 2),
  y: originY + (x + y) * (cellHeight / 2),
});

function drawCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  fill: string,
  stroke = "rgba(226, 240, 231, 0.08)",
) {
  const point = project(x, y);
  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(point.x + cellWidth / 2, point.y + cellHeight / 2);
  context.lineTo(point.x, point.y + cellHeight);
  context.lineTo(point.x - cellWidth / 2, point.y + cellHeight / 2);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 0.6;
  context.stroke();
}

function drawBuilding(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  flooded: boolean,
) {
  const point = project(x + 0.5, y + 0.5);
  const width = 12;
  const roofY = point.y - height;
  const roofColor = flooded ? "#d39462" : "#d7ded7";

  context.beginPath();
  context.moveTo(point.x, roofY);
  context.lineTo(point.x + width, roofY + 6);
  context.lineTo(point.x, roofY + 12);
  context.lineTo(point.x - width, roofY + 6);
  context.closePath();
  context.fillStyle = roofColor;
  context.fill();

  context.beginPath();
  context.moveTo(point.x - width, roofY + 6);
  context.lineTo(point.x, roofY + 12);
  context.lineTo(point.x, point.y + 7);
  context.lineTo(point.x - width, point.y + 1);
  context.closePath();
  context.fillStyle = flooded ? "#8d5b48" : "#87978f";
  context.fill();

  context.beginPath();
  context.moveTo(point.x, roofY + 12);
  context.lineTo(point.x + width, roofY + 6);
  context.lineTo(point.x + width, point.y + 1);
  context.lineTo(point.x, point.y + 7);
  context.closePath();
  context.fillStyle = flooded ? "#ad7052" : "#a8b6ae";
  context.fill();
}

function depthColor(depth: number) {
  if (depth >= 2) return "rgba(22, 83, 137, 0.92)";
  if (depth >= 1) return "rgba(29, 129, 178, 0.88)";
  if (depth >= 0.5) return "rgba(44, 175, 205, 0.80)";
  return "rgba(85, 216, 221, 0.68)";
}

function signed(value: number, suffix = "") {
  if (value === 0) return "변화 없음";
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

export function FloodLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rainfall, setRainfall] = useState(96);
  const [duration, setDuration] = useState(180);
  const [discharge, setDischarge] = useState(980);
  const [tide, setTide] = useState(0.8);
  const [activeTool, setActiveTool] = useState<Tool>("inspect");
  const [interventions, setInterventions] = useState<Intervention[]>(
    DEFAULT_INTERVENTIONS,
  );
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [timeline, setTimeline] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const simulate = useCallback(
    async (nextInterventions = interventions) => {
      setIsRunning(true);
      setError("");
      setIsPlaying(false);

      try {
        const response = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rainfall,
            duration,
            discharge,
            tide,
            interventions: nextInterventions,
          }),
        });

        if (!response.ok) throw new Error("simulation failed");
        const data = (await response.json()) as SimulationResult;
        setResult(data);
        setTimeline(100);
        setDirty(false);
      } catch {
        setError("계산 서버에 연결하지 못했습니다. 잠시 후 다시 실행해 주세요.");
      } finally {
        setIsRunning(false);
      }
    },
    [discharge, duration, interventions, rainfall, tide],
  );

  useEffect(() => {
    void simulate(DEFAULT_INTERVENTIONS);
    // Initial scenario only; later changes are intentionally run by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (timeline >= 100) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeline((current) => Math.min(100, current + 1));
    }, 75);
    return () => window.clearInterval(timer);
  }, [isPlaying, timeline]);

  const cellMap = useMemo(() => {
    const map = new Map<string, Cell>();
    result?.cells.forEach((cell) => map.set(`${cell.x}-${cell.y}`, cell));
    return map;
  }, [result]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const background = context.createLinearGradient(0, 0, 0, canvasHeight);
    background.addColorStop(0, "#16332f");
    background.addColorStop(1, "#0d211f");
    context.fillStyle = background;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let sum = 0; sum < 53; sum += 1) {
      for (let x = 0; x < 32; x += 1) {
        const y = sum - x;
        if (y < 0 || y >= 22) continue;
        const cell = cellMap.get(`${x}-${y}`);
        const riverDistance = Math.abs(y - (11 + Math.sin(x * 0.31) * 1.7));
        const isRoad = x === 8 || x === 20 || y === 5 || y === 17;
        let terrainColor = riverDistance < 1.15
          ? "#176571"
          : isRoad
            ? "#68746b"
            : cell && cell.elevation > 8
              ? "#486a4a"
              : "#3b6146";

        if ((x + y) % 5 === 0 && riverDistance >= 1.15 && !isRoad) {
          terrainColor = "#41694a";
        }
        drawCell(context, x, y, terrainColor);

        if (cell && cell.depth > 0 && timeline > 0) {
          const arrivalPercent = (cell.arrival / 12) * 100;
          if (timeline >= arrivalPercent) {
            const growth = clamp(
              (timeline - arrivalPercent) / Math.max(12, 100 - arrivalPercent),
              0,
              1,
            );
            const animatedDepth = cell.depth * (0.28 + growth * 0.72);
            if (animatedDepth >= 0.04) {
              drawCell(context, x, y, depthColor(animatedDepth), "rgba(127, 233, 237, 0.12)");
            }
          }
        }
      }
    }

    for (const [x, y, height] of BUILDINGS) {
      const cell = cellMap.get(`${x}-${y}`);
      const activeDepth =
        cell && timeline >= (cell.arrival / 12) * 100 ? cell.depth : 0;
      drawBuilding(context, x, y, height, activeDepth >= 0.2);
    }

    interventions.forEach((intervention) => {
      const point = project(intervention.x + 0.5, intervention.y + 0.5);
      const tool = TOOLS.find((item) => item.id === intervention.type);
      context.beginPath();
      context.arc(point.x, point.y - 7, 9, 0, Math.PI * 2);
      context.fillStyle = intervention.type === "blockage" ? "#ff9c6c" : "#e0f45d";
      context.fill();
      context.strokeStyle = "#102823";
      context.lineWidth = 2;
      context.stroke();
      context.fillStyle = "#102823";
      context.font = "700 11px Arial";
      context.textAlign = "center";
      context.fillText(tool?.mark ?? "•", point.x, point.y - 3);
    });
  }, [cellMap, interventions, timeline]);

  const placeIntervention = (x: number, y: number) => {
    const cell = cellMap.get(`${x}-${y}`) ?? null;
    setSelectedCell(cell);
    if (activeTool === "inspect") return;

    const next = [
      ...interventions,
      { id: `${activeTool}-${Date.now()}`, type: activeTool, x, y },
    ].slice(-16);
    setInterventions(next);
    setDirty(true);
  };

  const handleMapPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const screenX = (event.clientX - bounds.left) * (canvasWidth / bounds.width);
    const screenY = (event.clientY - bounds.top) * (canvasHeight / bounds.height);
    const a = (2 * (screenX - originX)) / cellWidth;
    const b = (2 * (screenY - originY)) / cellHeight;
    const x = Math.floor((a + b) / 2);
    const y = Math.floor((b - a) / 2);
    if (x >= 0 && x < 32 && y >= 0 && y < 22) placeIntervention(x, y);
  };

  const handleMapKey = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      placeIntervention(16, 11);
    }
  };

  const updateCondition = (setter: (value: number) => void, value: number) => {
    setter(value);
    setDirty(true);
  };

  const resetScenario = () => {
    setInterventions([]);
    setSelectedCell(null);
    setDirty(true);
  };

  const riskLabel = result
    ? result.metrics.riskScore >= 70
      ? "심각"
      : result.metrics.riskScore >= 45
        ? "주의"
        : "낮음"
    : "계산 중";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-symbol" aria-hidden="true"><span /></div>
          <div>
            <strong>RIVERSE</strong>
            <small>URBAN FLOOD DIGITAL TWIN</small>
          </div>
        </div>

        <div className="scenario-heading">
          <span className="eyebrow">시나리오 01 · 포항시</span>
          <h1>냉천 산업지구 공사 영향 분석</h1>
        </div>

        <div className="topbar-actions">
          <span className="status-pill"><i /> 모델 준비됨</span>
          <button className="ghost-button" type="button" onClick={resetScenario}>초기화</button>
          <button
            className={`run-button ${isRunning ? "is-running" : ""}`}
            type="button"
            onClick={() => void simulate()}
            disabled={isRunning}
          >
            <span aria-hidden="true">▶</span>
            {isRunning ? "수해 모델 계산 중" : dirty ? "변경사항 분석" : "다시 분석"}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-panel" aria-label="시뮬레이션 조건">
          <section className="panel-section intro-section">
            <span className="section-index">01 / CONDITIONS</span>
            <h2>어떤 비가 내리나요?</h2>
            <p>극한 강우와 하천 조건을 설정해 도시의 가장 취약한 순간을 재현합니다.</p>
          </section>

          <section className="panel-section condition-list">
            <label className="range-field">
              <span><b>시간당 강우</b><output>{rainfall} mm</output></span>
              <input
                type="range" min="10" max="180" step="2" value={rainfall}
                onChange={(event) => updateCondition(setRainfall, Number(event.target.value))}
              />
              <small><span>약한 비</span><span>극한 호우</span></small>
            </label>

            <label className="range-field">
              <span><b>지속 시간</b><output>{duration} 분</output></span>
              <input
                type="range" min="30" max="360" step="15" value={duration}
                onChange={(event) => updateCondition(setDuration, Number(event.target.value))}
              />
            </label>

            <label className="range-field">
              <span><b>상류 유량</b><output>{discharge.toLocaleString("ko-KR")} ㎥/s</output></span>
              <input
                type="range" min="100" max="2000" step="20" value={discharge}
                onChange={(event) => updateCondition(setDischarge, Number(event.target.value))}
              />
            </label>

            <label className="range-field">
              <span><b>하류 수위</b><output>{tide.toFixed(1)} m</output></span>
              <input
                type="range" min="0" max="3" step="0.1" value={tide}
                onChange={(event) => updateCondition(setTide, Number(event.target.value))}
              />
            </label>
          </section>

          <section className="panel-section preset-section">
            <div className="section-title-row">
              <div>
                <span className="section-index">02 / PRESET</span>
                <h2>빠른 시나리오</h2>
              </div>
            </div>
            <button
              type="button"
              className="preset-card active"
              onClick={() => {
                setRainfall(96); setDuration(180); setDischarge(980); setTide(0.8); setDirty(true);
              }}
            >
              <span className="preset-icon">태풍</span>
              <span><b>힌남노급 복합 홍수</b><small>강우 + 하천 범람 + 만조</small></span>
              <i>선택</i>
            </button>
            <button
              type="button"
              className="preset-card"
              onClick={() => {
                setRainfall(60); setDuration(120); setDischarge(520); setTide(0.3); setDirty(true);
              }}
            >
              <span className="preset-icon calm">집중</span>
              <span><b>도심 집중호우</b><small>배수 용량 초과 중심</small></span>
              <i>적용</i>
            </button>
          </section>

          <div className="model-note">
            <span aria-hidden="true">i</span>
            <p><b>MVP 수리 모델</b>50m 격자 기반 상대 위험 분석입니다. 공식 방재 판단에는 보정된 정밀 모델이 필요합니다.</p>
          </div>
        </aside>

        <section className="map-stage" aria-label="3D 침수 시뮬레이션 지도">
          <div className="map-toolbar" role="toolbar" aria-label="지도 편집 도구">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={activeTool === tool.id ? "active" : ""}
                onClick={() => setActiveTool(tool.id)}
                title={tool.description}
              >
                <span aria-hidden="true">{tool.mark}</span>
                {tool.label}
              </button>
            ))}
            <span className="toolbar-divider" />
            <button
              type="button"
              className="undo-tool"
              disabled={!interventions.length}
              onClick={() => {
                setInterventions((current) => current.slice(0, -1));
                setDirty(true);
              }}
            >
              <span aria-hidden="true">↶</span> 실행 취소
            </button>
          </div>

          <div className="map-context">
            <span className="live-dot" />
            <div><b>가상 지형 · 냉천 하류</b><small>격자 50m · 계산 영역 1.76㎢</small></div>
          </div>

          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="simulation-canvas"
            onPointerDown={handleMapPointer}
            onKeyDown={handleMapKey}
            tabIndex={0}
            aria-label={`${TOOLS.find((tool) => tool.id === activeTool)?.label} 도구 선택됨. 지도를 클릭하거나 Enter 키를 눌러 적용하세요.`}
          />

          {!result && !error && (
            <div className="map-loading"><span />첫 침수 시나리오를 계산하고 있습니다</div>
          )}
          {error && <div className="map-error" role="alert">{error}</div>}

          <div className="map-hint">
            <span>{TOOLS.find((tool) => tool.id === activeTool)?.mark}</span>
            <p><b>{TOOLS.find((tool) => tool.id === activeTool)?.label} 도구</b>
              {activeTool === "inspect" ? "지도의 격자를 선택해 수심을 확인하세요." : "지도에서 변경할 위치를 클릭하세요."}
            </p>
          </div>

          {selectedCell && (
            <div className="cell-inspector">
              <button type="button" aria-label="선택 정보 닫기" onClick={() => setSelectedCell(null)}>×</button>
              <span>선택 격자 {selectedCell.x + 1}-{selectedCell.y + 1}</span>
              <b>{selectedCell.depth.toFixed(2)} m</b>
              <small>예상 최대 수심 · 도달 {selectedCell.arrival * 15}분</small>
            </div>
          )}

          <div className="map-bottom-bar">
            <button
              type="button"
              className="play-button"
              aria-label={isPlaying ? "애니메이션 일시정지" : "침수 애니메이션 재생"}
              onClick={() => {
                if (timeline >= 100) setTimeline(0);
                setIsPlaying((current) => !current);
              }}
            >
              {isPlaying ? "Ⅱ" : "▶"}
            </button>
            <span className="time-label">00:00</span>
            <input
              aria-label="시뮬레이션 시간"
              type="range" min="0" max="100" value={timeline}
              onChange={(event) => { setTimeline(Number(event.target.value)); setIsPlaying(false); }}
            />
            <span className="time-label">03:00</span>
            <div className="depth-legend">
              <span>수심</span><i className="depth-1" /><small>0.2m</small><i className="depth-2" /><small>1m</small><i className="depth-3" /><small>2m+</small>
            </div>
          </div>
        </section>

        <aside className="insight-panel" aria-label="분석 결과">
          <section className="risk-summary">
            <span className="section-index">LIVE RISK ASSESSMENT</span>
            <div className="risk-title-row">
              <div><h2>종합 위험도</h2><p>현재 공사안 기준</p></div>
              <div className={`risk-badge risk-${riskLabel}`}>{riskLabel}</div>
            </div>
            <div className="risk-score">
              <strong>{result?.metrics.riskScore ?? "—"}</strong><span>/ 100</span>
              <div className="risk-meter"><i style={{ width: `${result?.metrics.riskScore ?? 0}%` }} /></div>
            </div>
            <div className={`delta-banner ${(result?.comparison.deltaRisk ?? 0) > 0 ? "worse" : "better"}`}>
              <span aria-hidden="true">{(result?.comparison.deltaRisk ?? 0) > 0 ? "↑" : "↓"}</span>
              <p>기준안 대비 위험도 <b>{signed(result?.comparison.deltaRisk ?? 0, "점")}</b></p>
            </div>
          </section>

          <section className="metric-grid">
            <article><span>최대 수심</span><b>{result?.metrics.maxDepth.toFixed(2) ?? "—"}<small> m</small></b><i className="metric-bar"><em style={{ width: `${Math.min(100, (result?.metrics.maxDepth ?? 0) * 28)}%` }} /></i></article>
            <article><span>침수 면적</span><b>{result?.metrics.floodedArea.toFixed(2) ?? "—"}<small> ㎢</small></b><i className="metric-bar"><em style={{ width: `${Math.min(100, (result?.metrics.floodedArea ?? 0) * 50)}%` }} /></i></article>
            <article><span>영향 건물</span><b>{result?.metrics.affectedBuildings ?? "—"}<small> 동</small></b><small className="metric-caption">산업시설 포함</small></article>
            <article><span>노출 도로</span><b>{result?.metrics.exposedRoads.toFixed(1) ?? "—"}<small> km</small></b><small className="metric-caption">통행 제한 예상</small></article>
          </section>

          <section className="impact-section">
            <div className="section-title-row"><div><span className="section-index">IMPACT DELTA</span><h2>공사 전후 영향</h2></div><span className="compare-chip">기준안 비교</span></div>
            <div className="comparison-bars">
              <div>
                <span><b>기준 시나리오</b><em>{result?.comparison.baselineRisk ?? "—"}</em></span>
                <i><u style={{ width: `${result?.comparison.baselineRisk ?? 0}%` }} /></i>
              </div>
              <div>
                <span><b>현재 공사안</b><em>{result?.metrics.riskScore ?? "—"}</em></span>
                <i><u className="current" style={{ width: `${result?.metrics.riskScore ?? 0}%` }} /></i>
              </div>
            </div>
            <div className="cost-impact">
              <span>예상 피해액 변화</span>
              <b>{signed(result?.comparison.deltaDamage ?? 0, "억 원")}</b>
            </div>
          </section>

          <section className="alerts-section">
            <div className="section-title-row"><div><span className="section-index">PRIORITY ALERTS</span><h2>우선 확인 지점</h2></div><span>{interventions.length + 2}건</span></div>
            <article className="alert-card severe"><i>01</i><div><b>냉천교 상류 통수 저하</b><p>공사 구조물 상류에 수위 상승이 집중됩니다.</p></div><span>심각</span></article>
            <article className="alert-card"><i>02</i><div><b>산업로 저지대</b><p>약 {result?.metrics.firstArrivalMinutes ?? 0}분 후 첫 침수가 예상됩니다.</p></div><span>주의</span></article>
          </section>

          <footer className="panel-footer">
            <span>{result?.model ?? "RIVERSE rapid-grid v0.1"}</span>
            <span>Google Solution Challenge MVP</span>
          </footer>
        </aside>
      </div>
    </main>
  );
}
