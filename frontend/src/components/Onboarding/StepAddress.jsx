import { useEffect, useRef, useState } from 'react';

// 관악구 대략 경계 상자(gwanak_dong_boundary.geojson bbox + 여유분).
// Places.keywordSearch를 관악구 인근으로 제한해서 "신림" 같은 흔한 키워드가
// 전국 결과로 뒤덮여 필터링 후 0건이 되는 상황을 줄인다.
// Geocoder.addressSearch는 지역 제한 옵션이 없어 관악구 필터는 결과 단계에서만 적용된다.
const GWANAK_RECT = '126.894,37.431,126.994,37.500';

function keywordSearchPromise(places, keyword) {
  return new Promise((resolve) => {
    places.keywordSearch(
      keyword,
      (result, status) => resolve({ result, status }),
      { rect: GWANAK_RECT }
    );
  });
}

function addressSearchPromise(geocoder, keyword) {
  return new Promise((resolve) => {
    geocoder.addressSearch(keyword, (result, status) => resolve({ result, status }));
  });
}

// Places 결과: place_name/road_address_name이 평평한 문자열로 온다.
function normalizePlaceItem(item) {
  return {
    placeName: item.place_name || null,
    addressName: item.address_name || '',
    roadAddressName: item.road_address_name || '',
    lat: parseFloat(item.y),
    lng: parseFloat(item.x),
  };
}

// Geocoder 결과: place_name이 없고, 지번/도로명 주소가 address/road_address 중첩 객체로 온다.
// address_type이 ROAD_ADDR이어도 address(지번) 객체는 대부분 같이 내려오므로 dedup 키로 쓸 수 있다.
function normalizeGeocodeItem(item) {
  return {
    placeName: null,
    addressName: (item.address && item.address.address_name) || item.address_name || '',
    roadAddressName: (item.road_address && item.road_address.address_name) || '',
    lat: parseFloat(item.y),
    lng: parseFloat(item.x),
  };
}

// road_address_name(도로명) 우선, 없으면 addressName(지번). 카카오 응답은 서울을 이미
// "서울"로 축약해서 주는 걸 확인했지만, 혹시 모를 케이스 대비 안전장치로 정규화해둔다.
function toDisplayAddress(item) {
  const base = item.roadAddressName || item.addressName;
  return base.replace(/^서울특별시\s/, '서울 ');
}

// Places + Geocoder 결과를 합치고, 지번(addressName) 기준으로 중복 제거.
// Geocoder를 앞에 둬서 같은 주소가 겹치면 "정확한 주소 일치" 쪽이 남게 한다.
function mergeResults(geoItems, placeItems) {
  const seen = new Set();
  const merged = [];
  for (const item of [...geoItems, ...placeItems]) {
    const key = item.addressName;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

// 온보딩 2단계: 주소 입력. Kakao Maps JS SDK(services)로 실시간 주소/장소 검색.
// autoload=false라 마운트 시 직접 kakao.maps.load()를 호출해야 Places/Geocoder를 쓸 수 있다.
export default function StepAddress({ onSubmit }) {
  const [sdkStatus, setSdkStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); // 선택된 정규화 항목 + displayAddress
  const [items, setItems] = useState([]);
  const [listState, setListState] = useState('idle'); // 'idle' | 'loading' | 'results' | 'empty' | 'error'
  const [highlightIndex, setHighlightIndex] = useState(0);

  const placesRef = useRef(null);
  const geocoderRef = useRef(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef(null);
  const itemRefs = useRef([]);

  // SDK 초기화 (컴포넌트 마운트 시 1회)
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      setSdkStatus('error');
      return;
    }
    window.kakao.maps.load(() => {
      placesRef.current = new window.kakao.maps.services.Places();
      geocoderRef.current = new window.kakao.maps.services.Geocoder();
      setSdkStatus('ready');
    });
  }, []);

  // 입력값 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (selected || sdkStatus !== 'ready') return;

    const trimmed = query.trim();
    if (!trimmed) {
      setItems([]);
      setListState('idle');
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(trimmed);
    }, 300);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sdkStatus, selected]);

  // 검색 결과가 바뀔 때마다 하이라이트 인덱스를 범위 안으로 클램프
  useEffect(() => {
    setHighlightIndex((i) => (items.length === 0 ? 0 : Math.max(0, Math.min(i, items.length - 1))));
  }, [items]);

  // 하이라이트된 항목이 드롭다운 밖으로 벗어나면 자동 스크롤
  useEffect(() => {
    const el = itemRefs.current[highlightIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  async function runSearch(keyword) {
    const myId = ++requestIdRef.current;
    setListState('loading');

    let placesRes;
    let geoRes;
    try {
      [placesRes, geoRes] = await Promise.all([
        keywordSearchPromise(placesRef.current, keyword),
        addressSearchPromise(geocoderRef.current, keyword),
      ]);
    } catch {
      if (myId !== requestIdRef.current) return;
      setItems([]);
      setListState('error');
      return;
    }

    if (myId !== requestIdRef.current) return; // 이미 최신 요청이 아님

    const { Status } = window.kakao.maps.services;
    const placesOk = placesRes.status === Status.OK;
    const geoOk = geoRes.status === Status.OK;
    const bothFailed =
      placesRes.status === Status.ERROR && geoRes.status === Status.ERROR;

    if (bothFailed) {
      setItems([]);
      setListState('error');
      return;
    }

    const geoItems = geoOk ? geoRes.result.map(normalizeGeocodeItem) : [];
    const placeItems = placesOk ? placesRes.result.map(normalizePlaceItem) : [];

    const filtered = mergeResults(geoItems, placeItems)
      .filter((item) => item.addressName.includes('관악구'))
      .slice(0, 5);

    setItems(filtered);
    setListState(filtered.length > 0 ? 'results' : 'empty');
  }

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSelected(null);
  };

  const handleSelect = (item) => {
    const displayAddress = toDisplayAddress(item);
    setSelected({ ...item, displayAddress });
    setQuery(displayAddress);
    setItems([]);
    setListState('idle');
  };

  const handleKeyDown = (e) => {
    if (listState !== 'results' || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(items[highlightIndex]);
    } else if (e.key === 'Escape') {
      setItems([]);
      setListState('idle');
    }
  };

  const handleStart = () => {
    if (!selected) return;
    onSubmit(selected.displayAddress, {
      lat: selected.lat,
      lng: selected.lng,
      placeName: selected.placeName,
    });
  };

  const inputDisabled = sdkStatus !== 'ready';
  const placeholder =
    sdkStatus === 'loading'
      ? '주소 검색 서비스를 불러오는 중...'
      : sdkStatus === 'error'
        ? '주소 검색 서비스를 이용할 수 없습니다.'
        : '예: 신림동, 봉천로, 남부순환로';

  return (
    <section className="screen active">
      <div className="onboard-wrap">
        <div className="onboard-card">
          <div className="brand-row">
            <span className="brand-dot" />
            <span className="brand-name">관악 안심지도</span>
          </div>
          <div className="progress-dots">
            <span className="on" />
            <span className="on" />
          </div>
          <h1 className="step-title">어디에 거주하고<br />계신가요?</h1>
          <p className="step-sub">관악구 내 주소를 입력하면 우리 동네 안전등급을 바로 보여드려요</p>

          <div className="field-label">주소</div>
          <input
            className="text-input"
            placeholder={placeholder}
            autoComplete="off"
            disabled={inputDisabled}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          <div className="addr-suggest-list">
            {listState === 'loading' && (
              <div className="addr-suggest-empty">검색 중...</div>
            )}
            {listState === 'empty' && (
              <div className="addr-suggest-empty">관악구 내 검색 결과가 없습니다.</div>
            )}
            {listState === 'error' && (
              <div className="addr-suggest-empty">주소 검색 서비스를 이용할 수 없습니다.</div>
            )}
            {listState === 'results' &&
              items.map((item, i) => (
                <div
                  key={`${item.addressName}-${i}`}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className={`addr-suggest-item${i === highlightIndex ? ' active' : ''}`}
                  onMouseEnter={() => setHighlightIndex(i)}
                  onClick={() => handleSelect(item)}
                >
                  <span className="pin">📍</span>
                  <span className="addr-suggest-text">
                    <span className="addr-suggest-main">{item.placeName || item.addressName}</span>
                    <span className="addr-suggest-sub">{item.roadAddressName || item.addressName}</span>
                  </span>
                </div>
              ))}
          </div>

          <button className="primary-btn" disabled={!selected} onClick={handleStart}>
            시작하기
          </button>
        </div>
      </div>
    </section>
  );
}
