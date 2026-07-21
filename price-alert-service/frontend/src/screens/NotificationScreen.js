// 알림 화면. (필터 칩으로 걸러 보고, 오늘/이번 주로 나눠 표시)

import React, { useState, useContext, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import ScreenHeader from '../components/ScreenHeader';
import FilterChips from '../components/FilterChips';
import NotificationCard from '../components/NotificationCard';
import { SURFACE, LINE, TEXT } from '../colors';
import { WatchlistContext } from '../store/WatchlistContext';

// 필터 칩 글자 목록
const filterOptionList = ['전체', '읽지 않음', '가격 하락', '목표가 도달'];

// 알림 화면
function NotificationScreen() {
  const [selectedFilter, setSelectedFilter] = useState('전체');

  // 저장소에서 알림 목록을 가져옴 (저장소가 백엔드/더미에서 불러옴)
  const { notifications, readNotification, reloadNotifications } = useContext(WatchlistContext);

  useFocusEffect(
    useCallback(function () {
      reloadNotifications();
    }, [])
  );

  // 알림 하나가 선택된 필터에 맞는지 확인
  function checkFilterMatch(notification) {
    if (selectedFilter === '전체') {
      return true;
    }
    if (selectedFilter === '읽지 않음') {
      return notification.isRead === false;
    }
    return notification.type === selectedFilter;
  }

  // '오늘' 묶음에서 필터에 맞는 알림만 골라냄
  const todayList = notifications.filter(function (notification) {
    return notification.section === '오늘' && checkFilterMatch(notification);
  });

  // '이번 주' 묶음에서 필터에 맞는 알림만 골라냄
  const thisWeekList = notifications.filter(function (notification) {
    return notification.section === '이번 주' && checkFilterMatch(notification);
  });

  // 필터를 거친 뒤 화면에 보이는 알림이 하나도 없는지 확인
  const isEmpty = todayList.length === 0 && thisWeekList.length === 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="알림" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 필터 칩 */}
        <View style={styles.chipArea}>
          <FilterChips
            options={filterOptionList}
            selectedOption={selectedFilter}
            onSelectOption={setSelectedFilter}
          />
        </View>

        {/* '오늘' 묶음 (알림이 있을 때만 제목 표시) */}
        {todayList.length > 0 ? <Text style={styles.sectionLabel}>오늘</Text> : null}
        {todayList.map(function (notification) {
          function handlePressNotification() {
            readNotification(notification.id);
          }

          return (
            <NotificationCard
              key={notification.id}
              productName={notification.productName}
              message={notification.message}
              time={notification.time}
              isRead={notification.isRead}
              onPress={handlePressNotification}
            />
          );
        })}

        {/* '이번 주' 묶음 (알림이 있을 때만 제목 표시) */}
        {thisWeekList.length > 0 ? <Text style={styles.sectionLabel}>이번 주</Text> : null}
        {thisWeekList.map(function (notification) {
          function handlePressNotification() {
            readNotification(notification.id);
          }

          return (
            <NotificationCard
              key={notification.id}
              productName={notification.productName}
              message={notification.message}
              time={notification.time}
              isRead={notification.isRead}
              onPress={handlePressNotification}
            />
          );
        })}

        {/* 알림이 아예 없을 때 / 필터 결과만 없을 때 각각 안내 */}
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>
            아직 받은 알림이 없어요.{'\n'}가격이 목표가 이하로 떨어지면 알림이 도착해요.
          </Text>
        ) : null}
        {notifications.length > 0 && isEmpty ? (
          <Text style={styles.emptyText}>해당하는 알림이 없어요.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  chipArea: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE.DEFAULT,
  },
  // 오늘 / 이번 주를 나누는 회색 띠 제목
  sectionLabel: {
    backgroundColor: SURFACE.BAND,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT.WEAK,
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 50,
  },
});

export default NotificationScreen;
