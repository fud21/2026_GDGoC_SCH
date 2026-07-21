import { useState } from 'react';

const GWANAK_CENTER = { lat: 37.4785, lng: 126.9516 }; // 지도 초기 중심 좌표(관악구청 부근)

// 검색창 입력 → 주소/좌표 변환 → 지도 이동까지의 로직을 묶어놓은 훅
// 모바일(MainMap)과 데스크탑(DesktopShell) 화면이 이 훅 하나를 함께 사용함
export function useLocationSearch(kakaoLoaded) {
  const [mapCenter, setMapCenter] = useState(GWANAK_CENTER);
  const [markerPos, setMarkerPos] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [foundAddress, setFoundAddress] = useState('');
  const [searching, setSearching] = useState(false);

  // 검색 버튼을 눌렀을 때: 먼저 "주소"로 찾아보고, 안 되면 "장소명(키워드)"으로 다시 찾아봄
  const handleSearch = () => {
    if (!searchText.trim() || !kakaoLoaded) return;
    setSearching(true);

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(searchText, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        // 주소로 바로 찾은 경우
        const pos = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) };
        setMapCenter(pos);
        setMarkerPos(pos);
        setFoundAddress(result[0].address_name || searchText);
        setSearching(false);
      } else {
        // 주소로 못 찾으면 장소명(예: "관악구청")으로 재검색
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(searchText, (data, pStatus) => {
          setSearching(false);
          if (pStatus === window.kakao.maps.services.Status.OK && data.length > 0) {
            const pos = { lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) };
            setMapCenter(pos);
            setMarkerPos(pos);
            setFoundAddress(data[0].address_name || searchText);
          } else {
            alert('주소를 찾을 수 없습니다. 다시 입력해주세요.');
          }
        });
      }
    });
  };

  return { mapCenter, markerPos, searchText, setSearchText, foundAddress, searching, handleSearch };
}
