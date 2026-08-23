"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type FloodCell = {
  x: number;
  y: number;
  elevation: number;
  depth: number;
  arrival: number;
};

export type FloodRegion = {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  coordinateSystem: string;
};

type FloodMapProps = {
  cells: FloodCell[];
  grid: { width: number; height: number };
  region: FloodRegion;
  timeline: number;
  selectedCell: FloodCell | null;
  onSelectCell: (cell: FloodCell) => void;
};

type KakaoLatLng = object;

type KakaoMapInstance = {
  addControl: (control: object, position: number) => void;
  setMinLevel: (level: number) => void;
  setMaxLevel: (level: number) => void;
  relayout: () => void;
};

type KakaoOverlay = {
  setMap: (map: KakaoMapInstance | null) => void;
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance;
  CustomOverlay: new (options: {
    map: KakaoMapInstance;
    position: KakaoLatLng;
    content: Node;
    xAnchor: number;
    yAnchor: number;
    zIndex: number;
  }) => KakaoOverlay;
  Circle: new (options: {
    map: KakaoMapInstance;
    center: KakaoLatLng;
    radius: number;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    fillColor: string;
    fillOpacity: number;
    zIndex: number;
  }) => KakaoOverlay;
  ZoomControl: new () => object;
  ControlPosition: { RIGHT: number };
  event: {
    addListener: (
      target: object,
      type: string,
      handler: () => void,
    ) => void;
  };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const SCRIPT_ID = "kakao-map-sdk";
let kakaoLoader: Promise<KakaoMaps> | null = null;

function loadKakaoMap(appKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Map SDK requires a browser."));
  }

  if (window.kakao?.maps) {
    return new Promise<KakaoMaps>((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    });
  }

  if (kakaoLoader) return kakaoLoader;

  kakaoLoader = new Promise<KakaoMaps>((resolve, reject) => {
    const finishLoading = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Map SDK를 불러오지 못했습니다."));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", finishLoading, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Kakao Map SDK를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.addEventListener("load", finishLoading, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Kakao Map SDK를 불러오지 못했습니다.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return kakaoLoader;
}

function heatColor(depth: number) {
  if (depth >= 2) return "rgba(224, 71, 55, 0.78)";
  if (depth >= 1) return "rgba(247, 157, 56, 0.72)";
  if (depth >= 0.5) return "rgba(38, 128, 190, 0.68)";
  return "rgba(48, 207, 214, 0.6)";
}

export function FloodMap({
  cells,
  grid,
  region,
  timeline,
  selectedCell,
  onSelectCell,
}: FloodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const overlaysRef = useRef<KakaoOverlay[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showSevere, setShowSevere] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [sdkError, setSdkError] = useState("");
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY ?? "";

  const data = useMemo(() => {
    const { north, south, east, west } = region.bounds;

    return cells.flatMap((cell) => {
      const arrivalPercent = (cell.arrival / 12) * 100;
      if (cell.depth < 0.08 || timeline < arrivalPercent) return [];

      const progress = Math.min(
        1,
        Math.max(0.2, (timeline - arrivalPercent) / 28),
      );

      return [{
        cell,
        lng: west + ((cell.x + 0.5) / grid.width) * (east - west),
        lat: north - ((cell.y + 0.5) / grid.height) * (north - south),
        visibleDepth: cell.depth * progress,
      }];
    });
  }, [cells, grid.height, grid.width, region.bounds, timeline]);

  useEffect(() => {
    if (!appKey || !containerRef.current) return;
    let cancelled = false;

    loadKakaoMap(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(region.center.lat, region.center.lng),
          level: 4,
        });
        map.setMinLevel(2);
        map.setMaxLevel(9);
        map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT);
        mapsRef.current = maps;
        mapRef.current = map;
        setMapReady(true);
        setSdkError("");
      })
      .catch(() => {
        if (!cancelled) setSdkError("카카오맵을 불러오지 못했습니다. 키와 등록 도메인을 확인해 주세요.");
      });

    return () => {
      cancelled = true;
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, [appKey, region.center.lat, region.center.lng]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!mapReady || !maps || !map) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    const nextOverlays: KakaoOverlay[] = [];

    if (showHeatmap) {
      data.forEach((datum) => {
        const size = Math.round(58 + Math.min(38, datum.visibleDepth * 17));
        const color = heatColor(datum.visibleDepth);
        const point = document.createElement("div");
        point.className = "kakao-heat-point";
        point.setAttribute("aria-hidden", "true");
        point.style.width = `${size}px`;
        point.style.height = `${size}px`;
        point.style.background = `radial-gradient(circle, ${color} 0%, ${color} 24%, transparent 72%)`;

        nextOverlays.push(new maps.CustomOverlay({
          map,
          position: new maps.LatLng(datum.lat, datum.lng),
          content: point,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 2,
        }));
      });
    }

    if (showSevere) {
      data.filter((datum) => datum.cell.depth >= 1).forEach((datum) => {
        const circle = new maps.Circle({
          map,
          center: new maps.LatLng(datum.lat, datum.lng),
          radius: 30,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          strokeOpacity: 0.86,
          fillColor: datum.cell.depth >= 2 ? "#dc4737" : "#f79d38",
          fillOpacity: 0.38,
          zIndex: 4,
        });
        maps.event.addListener(circle, "click", () => onSelectCell(datum.cell));
        nextOverlays.push(circle);
      });
    }

    if (selectedCell) {
      const selected = data.find(
        ({ cell }) => cell.x === selectedCell.x && cell.y === selectedCell.y,
      );
      if (selected) {
        nextOverlays.push(new maps.Circle({
          map,
          center: new maps.LatLng(selected.lat, selected.lng),
          radius: 48,
          strokeWeight: 4,
          strokeColor: "#dff35a",
          strokeOpacity: 1,
          fillColor: "#dff35a",
          fillOpacity: 0.18,
          zIndex: 6,
        }));
      }
    }

    overlaysRef.current = nextOverlays;
    map.relayout();

    return () => {
      nextOverlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [data, mapReady, onSelectCell, selectedCell, showHeatmap, showSevere]);

  return (
    <div className="map-provider-root kakao-map-root">
      <div className="map-toolbar map-layer-toolbar" role="toolbar" aria-label="지도 표시 설정">
        <button
          type="button"
          className={showHeatmap ? "active" : ""}
          onClick={() => setShowHeatmap((current) => !current)}
        >
          <span aria-hidden="true">◉</span> 침수 히트맵
        </button>
        <button
          type="button"
          className={showSevere ? "active" : ""}
          onClick={() => setShowSevere((current) => !current)}
        >
          <span aria-hidden="true">!</span> 1m 이상
        </button>
      </div>

      {appKey && <div ref={containerRef} className="kakao-map-canvas" aria-label={`${region.name} 카카오맵`} />}

      {!appKey && (
        <div className="map-api-empty" role="status">
          <div className="map-api-card">
            <span aria-hidden="true">MAP</span>
            <h2>카카오맵 JavaScript 키가 필요합니다</h2>
            <p>실제 지도를 표시하려면 프로젝트 루트의 <code>.env.local</code>에 아래 값을 추가해 주세요.</p>
            <code>NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY=발급받은_키</code>
            <small>localhost 도메인을 등록하고 서버를 다시 시작하면 냉천 지도와 히트맵이 표시됩니다.</small>
          </div>
        </div>
      )}

      {sdkError && <div className="map-error kakao-sdk-error" role="alert">{sdkError}</div>}
    </div>
  );
}
