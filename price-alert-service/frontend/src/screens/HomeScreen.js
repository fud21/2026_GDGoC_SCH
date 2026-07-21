// 홈 화면. (앱을 켜면 처음 보이는 메인 화면)

import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import ScreenHeader from '../components/ScreenHeader';
import SectionBand from '../components/SectionBand';
import SearchBar from '../components/SearchBar';
import StatBox from '../components/StatBox';
import ProductCard from '../components/ProductCard';
import { SURFACE, LINE, TEXT, POINT } from '../colors';
import { WatchlistContext } from '../store/WatchlistContext';

// 홈 화면
function HomeScreen({ navigation }) {
  // 저장소에서 등록된 상품 목록, 알림 목록, 알림 토글 기능을 가져옴
  const { watchedProducts, notifications, toggleAlert } = useContext(WatchlistContext);

  // 요약 숫자를 등록된 상품으로 계산
  const trackingCount = watchedProducts.length;
  let todayDropCount = 0;
  let reachedGoalCount = 0;
  for (let i = 0; i < watchedProducts.length; i = i + 1) {
    if (watchedProducts[i].status === '가격 하락') {
      todayDropCount = todayDropCount + 1;
    }
    if (watchedProducts[i].status === '목표가 도달') {
      reachedGoalCount = reachedGoalCount + 1;
    }
  }

  // 안 읽은 알림 개수 (있으면 상단 종에 빨간 점을 찍음)
  let unreadCount = 0;
  for (let i = 0; i < notifications.length; i = i + 1) {
    if (notifications[i].isRead === false) {
      unreadCount = unreadCount + 1;
    }
  }

  // 검색창을 눌렀을 때: 검색 탭으로 이동
  function handlePressSearch() {
    navigation.navigate('검색');
  }

  // 관심 상품 등록 줄을 눌렀을 때: 검색 탭 안의 상품 등록 화면으로 이동
  function handlePressRegister() {
    // initial: false → 등록 화면에서 뒤로가면 검색 화면이 나오게 함
    navigation.navigate('검색', { screen: '상품등록', initial: false });
  }

  // 전체를 눌렀을 때: 관심상품 탭으로 이동
  function handlePressViewAll() {
    navigation.navigate('관심상품');
  }

  // 우측 상단 종을 눌렀을 때: 알림 탭으로 이동
  function handlePressBell() {
    navigation.navigate('알림');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        title="살까?"
        rightIconName="notifications-outline"
        onPressRightIcon={handlePressBell}
        showRightDot={unreadCount > 0}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 검색창 (누르면 검색 탭으로 넘어감) */}
        <View style={styles.searchArea}>
          <SearchBar placeholder="상품명 또는 URL 검색" onPress={handlePressSearch} />
        </View>

        {/* 요약 숫자 3개 (테두리 없이 세로 선으로만 나눔) */}
        <View style={styles.statRow}>
          <StatBox label="추적 중" value={String(trackingCount)} />
          <View style={styles.statDivider} />
          <StatBox label="오늘 하락" value={String(todayDropCount)} />
          <View style={styles.statDivider} />
          <StatBox
            label="목표가 도달"
            value={String(reachedGoalCount)}
            valueColor={POINT.DEFAULT}
          />
        </View>

        <SectionBand />

        {/* 관심 상품 등록 줄 */}
        <TouchableOpacity style={styles.registerRow} onPress={handlePressRegister}>
          <Ionicons name="add" size={20} color={TEXT.STRONG} />
          <Text style={styles.registerText}>관심 상품 등록</Text>
          <Ionicons name="chevron-forward" size={18} color={TEXT.WEAK} />
        </TouchableOpacity>

        <SectionBand />

        {/* '추적 중 상품' 제목 + 전체 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>추적 중 상품</Text>
          <TouchableOpacity style={styles.moreRow} onPress={handlePressViewAll}>
            <Text style={styles.moreText}>전체</Text>
            <Ionicons name="chevron-forward" size={14} color={TEXT.SUB} />
          </TouchableOpacity>
        </View>

        {/* 등록된 상품을 하나씩 줄로 그림 (서버가 몇 개를 주든 그대로 다 그림) */}
        {watchedProducts.map(function (product) {
          // 이 상품의 종을 눌렀을 때: 저장소의 알림 상태를 뒤집음
          // (저장소를 함께 쓰므로 관심상품 화면의 같은 상품도 같이 바뀜)
          function handleToggleThisAlert() {
            toggleAlert(product.id);
          }

          return (
            <ProductCard
              key={product.id}
              name={product.name}
              mall={product.mall}
              imageUrl={product.imageUrl}
              currentLowestPrice={product.currentLowestPrice}
              targetPrice={product.targetPrice}
              statusLabel={product.status}
              priceHistory={product.priceHistory}
              isAlertOn={product.isAlertOn}
              onToggleAlert={handleToggleThisAlert}
            />
          );
        })}

        {/* 등록된 상품이 없을 때 안내 */}
        {watchedProducts.length === 0 ? (
          <Text style={styles.emptyText}>
            아직 등록한 상품이 없어요.{'\n'}검색해서 관심 상품을 등록해 보세요.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.object.isRequired, // 화면 이동 기능
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  searchArea: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  // 숫자 사이를 나누는 짧은 세로 선
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: LINE.DEFAULT,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: SURFACE.WHITE,
  },
  registerText: {
    flex: 1, // 화살표를 오른쪽 끝으로 밀기
    fontSize: 14,
    fontWeight: '600',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreText: {
    fontSize: 12,
    color: TEXT.SUB,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT.WEAK,
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 40,
  },
});

export default HomeScreen;
