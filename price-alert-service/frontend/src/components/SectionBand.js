// 구역과 구역 사이를 나누는 굵은 회색 띠입니다. (쇼핑 앱에서 흔히 쓰는 구분 방식)

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SURFACE } from '../colors';

// 회색 구분 띠
function SectionBand() {
  return <View style={styles.band} />;
}

const styles = StyleSheet.create({
  band: {
    height: 8,
    backgroundColor: SURFACE.BAND,
  },
});

export default SectionBand;
