// 상품 하나를 보여주는 목록 줄입니다. (홈·관심상품 화면에서 사용)
// 카드 테두리 없이 아래쪽 얇은 선으로만 구분해서, 여러 개가 이어지면 하나의 목록처럼 보입니다.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import PlaceholderImage from './PlaceholderImage';
import StatusBadge from './StatusBadge';
import MiniLineGraph from './MiniLineGraph';
import { SURFACE, LINE, TEXT, POINT } from '../colors';
import { formatPrice, calculateDropRate } from '../utils/priceUtils';

// 상품 줄
function ProductCard({
  name,
  mall,
  imageUrl = '',
  currentLowestPrice = null,
  targetPrice,
  statusLabel,
  priceHistory = [],
  isAlertOn = true,
  onToggleAlert = null,
  onDelete = null,
  showGraph = false,
}) {
  // 알림이 켜져 있으면 검은 채운 종, 꺼져 있으면 흐린 빈 종
  // (알림 상태는 저장소에 있어서 홈과 관심상품이 같은 값을 함께 씁니다)
  let bellIconName = 'notifications-off-outline';
  let bellIconColor = TEXT.WEAK;
  if (isAlertOn === true) {
    bellIconName = 'notifications';
    bellIconColor = TEXT.STRONG;
  }

  // 최저가가 숫자면 '239,000원'처럼, 아직 없으면 '-'로 표시
  let lowestPriceText = '-';
  if (typeof currentLowestPrice === 'number') {
    lowestPriceText = formatPrice(currentLowestPrice);
  }

  // 목표가에 도달했으면 최저가 금액과 그래프 선을 빨간색으로
  const isReached = statusLabel === '목표가 도달';
  let lowestPriceColor = TEXT.STRONG;
  let graphLineColor = TEXT.SUB;
  if (isReached === true) {
    lowestPriceColor = POINT.DEFAULT;
    graphLineColor = POINT.DEFAULT;
  }

  // 처음 가격보다 몇 % 내렸는지 (내리지 않았으면 0이라 표시하지 않음)
  let dropRate = 0;
  if (typeof currentLowestPrice === 'number') {
    dropRate = calculateDropRate(priceHistory, currentLowestPrice);
  }

  return (
    <View style={styles.row}>
      {/* 왼쪽: 상품 이미지 */}
      <PlaceholderImage size={64} uri={imageUrl} />

      {/* 가운데: 이름 / 쇼핑몰·상태 / 가격 / 목표가 */}
      <View style={styles.infoColumn}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.mallRow}>
          <Text style={styles.mall}>{mall}</Text>
          <StatusBadge label={statusLabel} />
        </View>

        <View style={styles.priceRow}>
          {dropRate > 0 ? <Text style={styles.dropRate}>{dropRate}%</Text> : null}
          <Text style={[styles.lowestPrice, { color: lowestPriceColor }]}>{lowestPriceText}</Text>
        </View>

        <Text style={styles.targetPrice}>목표 {formatPrice(targetPrice)}</Text>
      </View>

      {/* 버튼 칸: 삭제 기능을 받은 화면(관심상품)은 위아래 두 칸짜리 세로 박스
          위 칸은 알림 종, 아래 칸은 휴지통 */}
      {onDelete !== null ? (
        <View style={styles.actionBox}>
          <TouchableOpacity style={styles.actionCell} onPress={onToggleAlert}>
            <Ionicons name={bellIconName} size={17} color={bellIconColor} />
          </TouchableOpacity>

          {/* 두 칸을 나누는 가로 선 */}
          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionCell} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color={TEXT.WEAK} />
          </TouchableOpacity>
        </View>
      ) : (
        // 삭제 기능이 없는 화면(홈)은 종 버튼 하나만 둥근 사각형으로 그림
        <TouchableOpacity style={styles.bellButton} onPress={onToggleAlert}>
          <Ionicons name={bellIconName} size={17} color={bellIconColor} />
        </TouchableOpacity>
      )}

      {/* 오른쪽: 꺾은선 그래프 (관심상품 화면에서만)
          세로 길이는 가운데 정보 칸(상품이름 ~ 목표가)의 높이에 자동으로 맞춰집니다 */}
      {showGraph ? (
        <View style={styles.graphPanel}>
          <MiniLineGraph data={priceHistory} lineColor={graphLineColor} />
        </View>
      ) : null}
    </View>
  );
}

ProductCard.propTypes = {
  name: PropTypes.string.isRequired, // 상품 이름
  mall: PropTypes.string.isRequired, // 쇼핑몰 이름
  imageUrl: PropTypes.string, // 상품 이미지 주소
  currentLowestPrice: PropTypes.number, // 현재 최저가 (숫자, 없으면 null)
  targetPrice: PropTypes.number.isRequired, // 목표가 (등록 때 사람이 설정한 숫자)
  statusLabel: PropTypes.string.isRequired, // 상태 태그 글자
  priceHistory: PropTypes.arrayOf(PropTypes.number), // 그래프용 가격 기록
  isAlertOn: PropTypes.bool, // 알림 켜짐/꺼짐
  onToggleAlert: PropTypes.func, // 종을 눌렀을 때 실행할 함수
  onDelete: PropTypes.func, // 삭제 버튼을 눌렀을 때 실행할 함수 (없으면 버튼이 안 보임)
  showGraph: PropTypes.bool, // 오른쪽 그래프 표시 여부
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center', // 이미지·버튼·그래프를 정보 칸 높이에 맞춰 가운데 정렬
    backgroundColor: SURFACE.WHITE,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, // 카드 테두리 대신 아래쪽 얇은 선
    borderBottomColor: LINE.DEFAULT,
  },
  infoColumn: {
    flex: 1, // 가운데가 남는 공간 차지
  },
  name: {
    fontSize: 14,
    fontWeight: '500', // 상품 이름은 굵지 않게 (가격이 주인공)
    color: TEXT.DEFAULT,
    letterSpacing: -0.3,
  },
  mallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mall: {
    fontSize: 12,
    color: TEXT.WEAK,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  // 하락률: 이 화면에서 가장 눈에 띄어야 하는 정보
  dropRate: {
    fontSize: 14,
    fontWeight: '800',
    color: POINT.DEFAULT,
    letterSpacing: -0.3,
  },
  lowestPrice: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  targetPrice: {
    fontSize: 12,
    color: TEXT.SUB,
    marginTop: 3,
  },
  // 관심상품 줄의 버튼 박스: 위(알림) 아래(삭제) 두 칸으로 나뉜 세로 사각형
  actionBox: {
    width: 34,
    alignSelf: 'stretch', // 정보 칸(이름~목표가) 높이만큼 세로로 늘어남
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE.STRONG,
    borderRadius: 6,
    overflow: 'hidden', // 눌린 표시가 둥근 모서리를 넘지 않게 자름
  },
  actionCell: {
    flex: 1, // 위아래 칸이 높이를 반씩 나눠 가짐
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE.STRONG,
  },
  // 홈 줄의 종 버튼: 둥근 모서리 사각형 하나
  bellButton: {
    width: 34,
    height: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE.STRONG,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 오른쪽 그래프 칸: 가로 길이는 고정, 세로 길이는 정보 칸 높이에 맞춤
  graphPanel: {
    width: 64,
    alignSelf: 'stretch',
  },
});

export default ProductCard;
