"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FloodMap,
  type FloodCell,
  type FloodRegion,
} from "./flood-map";

type SimulationResult = {
  cells: FloodCell[];
  grid: { width: number; height: number; cellMeters: number };
  region: FloodRegion;
  metrics: {
    maxDepth: number;
    floodedArea: number;
    affectedBuildings: number;
    exposedRoads: number;
    firstArrivalMinutes: number;
    riskScore: number;
    estimatedDamage: number;
  };
  model: string;
  generatedAt: string;
};

const DEFAULTS = {
  rainfall: 96,
  duration: 180,
  discharge: 980,
  tide: 0.8,
};

const FALLBACK_REGION: FloodRegion = {
  id: "pohang-naengcheon",
  name: "포항시 냉천 하류",
  center: { lat: 35.99035, lng: 129.4027 },
  bounds: {
    north: 35.9958,
    south: 35.9848,
    east: 129.4116,
    west: 129.3938,
  },
  coordinateSystem: "WGS84",
};

export function FloodLab() {
  const [rainfall, setRainfall] = useState(DEFAULTS.rainfall);
  const [duration, setDuration] = useState(DEFAULTS.duration);
  const [discharge, setDischarge] = useState(DEFAULTS.discharge);
  const [tide, setTide] = useState(DEFAULTS.tide);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedCell, setSelectedCell] = useState<FloodCell | null>(null);
  const [timeline, setTimeline] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const simulate = useCallback(async () => {
    setIsRunning(true);
    setError("");
    setIsPlaying(false);
    setSelectedCell(null);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainfall, duration, discharge, tide }),
      });

      if (!response.ok) throw new Error("simulation failed");
      setResult((await response.json()) as SimulationResult);
      setTimeline(100);
      setDirty(false);
    } catch {
      setError("계산 서버에 연결하지 못했습니다. 잠시 후 다시 실행해 주세요.");
    } finally {
      setIsRunning(false);
    }
  }, [discharge, duration, rainfall, tide]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void simulate();
    // 최초 한 번만 기본 시나리오를 계산합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying || timeline >= 100) return;

    const timer = window.setInterval(() => {
      setTimeline((current) => Math.min(100, current + 1));
    }, 75);
    return () => window.clearInterval(timer);
  }, [isPlaying, timeline]);

  const updateCondition = (setter: (value: number) => void, value: number) => {
    setter(value);
    setDirty(true);
  };

  const applyPreset = (preset: typeof DEFAULTS) => {
    setRainfall(preset.rainfall);
    setDuration(preset.duration);
    setDischarge(preset.discharge);
    setTide(preset.tide);
    setDirty(true);
  };

  const resetConditions = () => {
    applyPreset(DEFAULTS);
    setSelectedCell(null);
  };

  const riskLabel = result
    ? result.metrics.riskScore >= 70
      ? "심각"
      : result.metrics.riskScore >= 45
        ? "주의"
        : "낮음"
    : "계산 중";

  const riskCells = useMemo(
    () =>
      [...(result?.cells ?? [])]
        .filter((cell) => cell.depth >= 1)
        .sort((a, b) => b.depth - a.depth)
        .slice(0, 2),
    [result],
  );

  const currentMinutes = Math.round((timeline / 100) * 180);
  const isPlaybackActive = isPlaying && timeline < 100;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-symbol" aria-hidden="true"><span /></div>
          <div>
            <strong>RIVERSE</strong>
            <small>NEIGHBORHOOD FLOOD MAP</small>
          </div>
        </div>

        <div className="scenario-heading">
          <span className="eyebrow">우리 동네 침수 위험 · 포항시</span>
          <h1>냉천 하류 예상 침수지역</h1>
        </div>

        <div className="topbar-actions">
          <span className="status-pill"><i /> 지도 모델 준비됨</span>
          <button className="ghost-button" type="button" onClick={resetConditions}>조건 초기화</button>
          <button
            className={`run-button ${isRunning ? "is-running" : ""}`}
            type="button"
            onClick={() => void simulate()}
            disabled={isRunning}
          >
            <span aria-hidden="true">▶</span>
            {isRunning ? "위험지역 계산 중" : dirty ? "설정한 조건으로 확인" : "위험지역 다시 계산"}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-panel" aria-label="비와 하천 조건">
          <section className="panel-section intro-section">
            <span className="section-index">01 / WEATHER</span>
            <h2>어떤 비가 내리나요?</h2>
            <p>예상되는 비와 하천 상태를 선택하면 지도에서 침수 가능성이 높은 위치를 확인할 수 있습니다.</p>
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
                <span className="section-index">02 / QUICK CHECK</span>
                <h2>대표 상황으로 확인</h2>
              </div>
            </div>
            <button type="button" className="preset-card active" onClick={() => applyPreset(DEFAULTS)}>
              <span className="preset-icon">태풍</span>
              <span><b>태풍급 복합 홍수</b><small>강우 + 하천 범람 + 높은 하류 수위</small></span>
              <i>적용</i>
            </button>
            <button
              type="button"
              className="preset-card"
              onClick={() => applyPreset({ rainfall: 60, duration: 120, discharge: 520, tide: 0.3 })}
            >
              <span className="preset-icon calm">집중</span>
              <span><b>도심 집중호우</b><small>짧은 시간에 강한 비</small></span>
              <i>적용</i>
            </button>
          </section>

          <div className="model-note">
            <span aria-hidden="true">i</span>
            <p><b>시연용 예상 결과</b>현재는 실제 냉천 지도 위에 가상 50m 격자 모델을 표시합니다. 재난 시에는 정부·지자체 안내를 우선해 주세요.</p>
          </div>
        </aside>

        <section className="map-stage" aria-label="실제 2D 지도 기반 침수 위험 히트맵">
          <FloodMap
            cells={result?.cells ?? []}
            grid={result?.grid ?? { width: 32, height: 22 }}
            region={result?.region ?? FALLBACK_REGION}
            timeline={timeline}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
          />

          <div className="map-context">
            <span className="live-dot" />
            <div><b>실제 카카오맵 · 냉천 하류</b><small>위험도 히트맵 · WGS84 좌표</small></div>
          </div>

          {!result && !error && (
            <div className="map-loading"><span />첫 침수 위험을 계산하고 있습니다</div>
          )}
          {error && <div className="map-error" role="alert">{error}</div>}

          {selectedCell && (
            <div className="cell-inspector">
              <button type="button" aria-label="선택 정보 닫기" onClick={() => setSelectedCell(null)}>×</button>
              <span>선택한 위험 지점</span>
              <b>{selectedCell.depth.toFixed(2)} m</b>
              <small>예상 최대 수심 · 약 {selectedCell.arrival * 15}분 뒤 도달</small>
            </div>
          )}

          <div className="map-bottom-bar">
            <button
              type="button"
              className="play-button"
              aria-label={isPlaybackActive ? "시간 변화 일시정지" : "침수지역 시간 변화 재생"}
              onClick={() => {
                if (timeline >= 100) {
                  setTimeline(0);
                  setIsPlaying(true);
                  return;
                }
                setIsPlaying((current) => !current);
              }}
            >
              {isPlaybackActive ? "Ⅱ" : "▶"}
            </button>
            <span className="time-label">0분</span>
            <input
              aria-label="침수 예상 시간"
              type="range" min="0" max="100" value={timeline}
              onChange={(event) => { setTimeline(Number(event.target.value)); setIsPlaying(false); }}
            />
            <span className="time-label">{currentMinutes}분</span>
            <div className="depth-legend">
              <span>예상 수심</span><i className="depth-1" /><small>0.2m</small><i className="depth-2" /><small>1m</small><i className="depth-3" /><small>2m+</small>
            </div>
          </div>
        </section>

        <aside className="insight-panel" aria-label="침수 위험 결과">
          <section className="risk-summary">
            <span className="section-index">CURRENT FLOOD RISK</span>
            <div className="risk-title-row">
              <div><h2>우리 동네 위험도</h2><p>현재 설정한 비와 하천 조건</p></div>
              <div className={`risk-badge risk-${riskLabel}`}>{riskLabel}</div>
            </div>
            <div className="risk-score">
              <strong>{result?.metrics.riskScore ?? "--"}</strong><span>/ 100</span>
              <div className="risk-meter"><i style={{ width: `${result?.metrics.riskScore ?? 0}%` }} /></div>
            </div>
          </section>

          <section className="metric-grid" aria-label="주요 침수 예상 수치">
            <article><span>예상 최대 수심</span><b>{result?.metrics.maxDepth.toFixed(2) ?? "--"} <small>m</small></b><span className="metric-caption">1m 이상이면 차량 이동이 매우 위험합니다</span></article>
            <article><span>예상 침수 면적</span><b>{result?.metrics.floodedArea.toFixed(2) ?? "--"} <small>㎢</small></b><span className="metric-caption">수심 15cm 이상 기준</span></article>
            <article><span>영향 가능 건물</span><b>{result?.metrics.affectedBuildings ?? "--"} <small>동</small></b><span className="metric-caption">시연용 건물 지점 기준</span></article>
            <article><span>위험 가능 도로</span><b>{result?.metrics.exposedRoads.toFixed(1) ?? "--"} <small>km</small></b><span className="metric-caption">차량 통행 전 현장 통제를 확인하세요</span></article>
          </section>

          <section className="impact-section">
            <div className="section-title-row">
              <div><span className="section-index">SAFETY GUIDE</span><h2>시민 행동 안내</h2></div>
              <span className="compare-chip">최초 약 {result?.metrics.firstArrivalMinutes ?? "--"}분</span>
            </div>
            <div className="safety-guide">
              <p><b>지하 공간을 먼저 확인하세요.</b> 반지하·지하주차장에 있다면 침수 전에 지상으로 이동하세요.</p>
              <p><b>물에 잠긴 도로에는 진입하지 마세요.</b> 지도 결과와 별개로 경찰·지자체 통제를 우선하세요.</p>
            </div>
          </section>

          <section className="alerts-section">
            <div className="section-title-row"><div><span className="section-index">RISK POINTS</span><h2>주의할 위치</h2></div><span>{riskCells.length}곳</span></div>
            {riskCells.length ? riskCells.map((cell, index) => (
              <button className="alert-card severe alert-button" type="button" key={`${cell.x}-${cell.y}`} onClick={() => setSelectedCell(cell)}>
                <i>0{index + 1}</i>
                <span className="alert-copy"><b>냉천 인접 저지대 격자 {cell.x + 1}-{cell.y + 1}</b><small>예상 수심 {cell.depth.toFixed(2)}m · 약 {cell.arrival * 15}분 뒤</small></span>
                <em>심각</em>
              </button>
            )) : <p className="empty-alert">현재 조건에서는 1m 이상 위험 지점이 없습니다.</p>}
          </section>

          <footer className="panel-footer"><span>{result?.model ?? "RIVERSE rapid-grid v0.1"}</span><span>예측값 · 공식 재난정보 아님</span></footer>
        </aside>
      </div>
    </main>
  );
}
