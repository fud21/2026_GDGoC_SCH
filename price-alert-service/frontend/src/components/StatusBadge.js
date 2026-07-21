// 상품 상태를 보여주는 작은 태그입니다.
// '목표가 도달'만 빨간색으로 채워 눈에 띄게 하고, 나머지는 회색 테두리로 조용하게 둡니다.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { SURFACE, LINE, TEXT, POINT } from '../colors';

// 상태 태그
function StatusBadge({ label }) {
  // 목표가에 도달한 상품인지 확인
  const isReached = label === '목표가 도달';

  // 도달했으면 빨간 태그, 아니면 회색 태그
  let badgeStyle = styles.badgeNormal;
  let textStyle = styles.textNormal;
  if (isReached === true) {
    badgeStyle = styles.badgeReached;
    textStyle = styles.textReached;
  }

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired, // 태그 글자
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeNormal: {
    borderColor: LINE.STRONG,
    backgroundColor: SURFACE.WHITE,
  },
  badgeReached: {
    borderColor: POINT.DEFAULT,
    backgroundColor: POINT.DEFAULT,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  textNormal: {
    color: TEXT.SUB,
  },
  textReached: {
    color: TEXT.INVERSE,
  },
});

export default StatusBadge;
