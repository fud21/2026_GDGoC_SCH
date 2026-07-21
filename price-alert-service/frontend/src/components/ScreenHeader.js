// 화면 맨 위의 제목 줄입니다.
// 뒤로가기가 있으면 제목을 가운데에, 없으면(탭 화면) 제목을 왼쪽에 크게 놓습니다.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';
import { SURFACE, LINE, TEXT, POINT } from '../colors';

// 상단 제목 줄
function ScreenHeader({
  title,
  showBackButton = false,
  rightIconName = '',
  onPressRightIcon = null,
  showRightDot = false,
}) {
  const navigation = useNavigation();

  // 뒤로가기 화살표를 눌렀을 때 실행
  function handlePressBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('홈');
    }
  }

  // 뒤로가기가 있으면 가운데 제목, 없으면 왼쪽 큰 제목
  let titleStyle = styles.largeTitle;
  if (showBackButton === true) {
    titleStyle = styles.centerTitle;
  }

  return (
    <View style={styles.bar}>
      {/* 왼쪽: 뒤로가기 (필요할 때만) */}
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={handlePressBack}>
          <Ionicons name="chevron-back" size={24} color={TEXT.STRONG} />
        </TouchableOpacity>
      ) : null}

      <Text style={titleStyle} numberOfLines={1}>
        {title}
      </Text>

      {/* 오른쪽: 아이콘 (있을 때만). 빨간 점은 안 읽은 알림이 있을 때만 */}
      <View style={styles.rightArea}>
        {rightIconName !== '' ? (
          <TouchableOpacity onPress={onPressRightIcon}>
            <Ionicons name={rightIconName} size={22} color={TEXT.STRONG} />
            {showRightDot ? <View style={styles.dot} /> : null}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

ScreenHeader.propTypes = {
  title: PropTypes.string.isRequired, // 화면 제목
  showBackButton: PropTypes.bool, // 뒤로가기 표시 여부
  rightIconName: PropTypes.string, // 오른쪽 아이콘 이름
  onPressRightIcon: PropTypes.func, // 오른쪽 아이콘을 눌렀을 때 실행할 함수
  showRightDot: PropTypes.bool, // 오른쪽 아이콘 위 빨간 점 표시 여부
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: SURFACE.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth, // 머리카락처럼 얇은 선
    borderBottomColor: LINE.DEFAULT,
  },
  // 뒤로가기 칸과 오른쪽 칸의 너비를 같게 해야 제목이 정가운데로 옴
  backButton: {
    width: 32,
    marginLeft: -6, // 화살표가 왼쪽에 붙어 보이도록 살짝 당김
  },
  rightArea: {
    width: 32,
    alignItems: 'flex-end',
  },
  largeTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: TEXT.STRONG,
    letterSpacing: -0.5, // 한글은 자간을 살짝 좁혀야 단단해 보임
  },
  centerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  dot: {
    position: 'absolute', // 종 아이콘 오른쪽 위에 겹쳐 놓음
    top: -1,
    right: -1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: POINT.DEFAULT,
  },
});

export default ScreenHeader;
