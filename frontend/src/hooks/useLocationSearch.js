import { useState } from 'react';

const GWANAK_CENTER = { lat: 37.4785, lng: 126.9516 };

export function useLocationSearch(kakaoLoaded) {
  const [mapCenter, setMapCenter] = useState(GWANAK_CENTER);
  const [markerPos, setMarkerPos] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [foundAddress, setFoundAddress] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!searchText.trim() || !kakaoLoaded) return;
    setSearching(true);

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(searchText, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const pos = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) };
        setMapCenter(pos);
        setMarkerPos(pos);
        setFoundAddress(result[0].address_name || searchText);
        setSearching(false);
      } else {
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
