// 알림 한 건을 보여주는 목록 줄입니다. (알림 화면에서 사용)
// 안 읽은 알림은 왼쪽에 빨간 점이 붙고 상품명이 굵게 보입니다.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { SURFACE, LINE, TEXT, POINT } from '../colors';

// 알림 줄
function NotificationCard({ productName, message, time, isRead, onPress = null }) {
  // 읽은 알림은 상품명을 덜 굵게 (안 읽은 알림이 더 눈에 띄도록)
  let nameStyle = styles.nameUnread;
  if (isRead === true) {
    nameStyle = styles.nameRead;
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {/* 안 읽은 알림 앞의 빨간 점 */}
      <View style={styles.dotArea}>
        {isRead === false ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={styles.textArea}>
        <View style={styles.topRow}>
          <Text style={[styles.name, nameStyle]} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

NotificationCard.propTypes = {
  productName: PropTypes.string.isRequired, // 상품 이름
  message: PropTypes.string.isRequired, // 알림 내용
  time: PropTypes.string.isRequired, // 알림 온 시간
  isRead: PropTypes.bool.isRequired, // 읽음 여부
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: SURFACE.WHITE,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE.DEFAULT,
  },
  // 빨간 점 자리 (점이 없어도 글자 시작 위치가 흔들리지 않게 자리를 비워 둠)
  dotArea: {
    width: 6,
    paddingTop: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: POINT.DEFAULT,
  },
  textArea: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1, // 시간을 오른쪽 끝으로 밀기
    fontSize: 14,
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  nameUnread: {
    fontWeight: '700',
  },
  nameRead: {
    fontWeight: '500',
    color: TEXT.DEFAULT,
  },
  time: {
    fontSize: 11,
    color: TEXT.WEAK,
  },
  message: {
    fontSize: 13,
    color: TEXT.SUB,
    lineHeight: 18,
  },
});

export default NotificationCard;
