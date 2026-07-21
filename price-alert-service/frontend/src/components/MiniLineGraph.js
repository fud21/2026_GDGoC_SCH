// 가격 변동을 꺾은선으로 그리는 작은 그래프입니다.
// 그래프 크기는 부모(카드의 오른쪽 칸)의 크기에 맞춰 자동으로 정해집니다.

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import PropTypes from 'prop-types';
import { TEXT } from '../colors';

// 꺾은선 그래프
function MiniLineGraph({ data, lineColor = TEXT.SUB }) {
  // 그래프를 그릴 칸의 실제 크기 (화면에 그려진 뒤에 알 수 있음)
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });

  // 칸의 크기가 정해지면 그 크기를 기억함
  function handleLayout(event) {
    const layout = event.nativeEvent.layout;
    setGraphSize({ width: layout.width, height: layout.height });
  }

  // 아직 크기를 모르거나 값이 2개보다 적으면 선을 그릴 수 없음
  const canDraw = graphSize.width > 0 && data.length >= 2;

  // 꺾은선을 이룰 점들의 좌표 ("x1,y1 x2,y2 ..." 형태)와 마지막 점의 위치
  let pointsText = '';
  let lastX = 0;
  let lastY = 0;

  if (canDraw) {
    // 선이 가장자리에 딱 붙지 않도록 여백을 조금 둠
    const padding = 4;
    const usableWidth = graphSize.width - padding * 2;
    const usableHeight = graphSize.height - padding * 2;

    // 가장 큰 값과 작은 값을 찾음 (세로 위치 계산에 사용)
    let maxValue = data[0];
    let minValue = data[0];
    for (let i = 0; i < data.length; i = i + 1) {
      if (data[i] > maxValue) {
        maxValue = data[i];
      }
      if (data[i] < minValue) {
        minValue = data[i];
      }
    }

    // 모든 값이 같으면 0으로 나누는 것을 막기 위해 범위를 1로 둠
    let range = maxValue - minValue;
    if (range === 0) {
      range = 1;
    }

    for (let i = 0; i < data.length; i = i + 1) {
      // 가로 위치: 왼쪽에서 오른쪽으로 같은 간격
      const x = padding + (usableWidth * i) / (data.length - 1);

      // 세로 위치: 값이 클수록 위쪽(y가 작아짐)
      const ratio = (data[i] - minValue) / range; // 0 ~ 1 사이 값
      const y = padding + usableHeight * (1 - ratio);

      pointsText = pointsText + x + ',' + y + ' ';
      lastX = x;
      lastY = y;
    }
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {canDraw ? (
        <Svg width={graphSize.width} height={graphSize.height}>
          <Polyline
            points={pointsText.trim()}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {/* 마지막(지금) 가격 위치에 점을 찍어 어디가 현재인지 보여줌 */}
          <Circle cx={lastX} cy={lastY} r={2.5} fill={lineColor} />
        </Svg>
      ) : (
        <Text style={styles.emptyText}>-</Text>
      )}
    </View>
  );
}

MiniLineGraph.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired, // 가격 기록 (숫자 배열)
  lineColor: PropTypes.string, // 선 색
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // 부모 칸을 가득 채움
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: TEXT.WEAK,
  },
});

export default MiniLineGraph;
