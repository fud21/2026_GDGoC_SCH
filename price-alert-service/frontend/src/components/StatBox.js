// 숫자 하나와 설명 글자를 보여주는 통계 칸입니다.
// 테두리는 없고, 여러 개를 나란히 두면 너비를 똑같이 나눠 가집니다.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { TEXT } from '../colors';

// 통계 칸 (숫자 + 설명)
function StatBox({ label, value, valueColor = TEXT.STRONG }) {
  return (
    <View style={styles.box}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

StatBox.propTypes = {
  label: PropTypes.string.isRequired, // 설명 글자
  value: PropTypes.string.isRequired, // 숫자 글자
  valueColor: PropTypes.string, // 숫자 색
};

const styles = StyleSheet.create({
  box: {
    flex: 1, // 여러 개를 나란히 두면 너비를 똑같이 나눔
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
});

export default StatBox;
