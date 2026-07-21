// 마이페이지 화면. (내 정보·이용 현황·설정 메뉴)

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import ScreenHeader from '../components/ScreenHeader';
import SectionBand from '../components/SectionBand';
import StatBox from '../components/StatBox';
import ConfirmModal from '../components/ConfirmModal';
import { logoutUser } from '../api/client';
import { SURFACE, LINE, TEXT, POINT } from '../colors';
import { WatchlistContext } from '../store/WatchlistContext';
import { clearAuthSession, getAuthSession, getCurrentUser } from '../store/AuthSession';

// 설정 메뉴 목록 (앱에 고정된 항목이라 백엔드 데이터가 아님)
const menuList = [
  { id: 1, label: '가격 변동 히스토리' },
  { id: 2, label: '관심상품 · 쇼핑몰 관리' },
  { id: 3, label: '알림 설정' },
  { id: 4, label: '자주 묻는 질문' },
  { id: 5, label: '문의하기' },
  { id: 6, label: '앱 정보' },
];

// 마이페이지 화면
function MyPageScreen() {
  const navigation = useNavigation();

  // 저장소에서 등록된 상품 목록과 알림 목록을 가져옴 (개수 계산용)
  const { watchedProducts, notifications } = useContext(WatchlistContext);

  // 내 정보(아이디·이메일)
  const [profile, setProfile] = useState({ userId: '', email: '' });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 화면이 처음 그려질 때 내 정보를 불러옴
  useEffect(function () {
    const user = getCurrentUser();
    if (user) {
      setProfile({
        userId: user.userId,
        email: user.email,
      });
    }
  }, []);

  // 관심 상품 수 · 목표 달성 수를 등록된 상품으로 계산
  const watchCount = watchedProducts.length;
  let goalCount = 0;
  for (let i = 0; i < watchedProducts.length; i = i + 1) {
    if (watchedProducts[i].status === '목표가 도달') {
      goalCount = goalCount + 1;
    }
  }

  // 프로필 줄을 눌렀을 때 실행 (백엔드 필요)
  function handlePressProfile() {
    Alert.alert('준비중입니다');
  }

  // 로그아웃을 확정했을 때 로그인 화면으로 되돌림
  async function handleConfirmLogout() {
    setIsLogoutModalOpen(false);
    const auth = getAuthSession();
    try {
      await logoutUser(auth ? auth.accessToken : null);
    } catch (error) {
      console.warn('로그아웃 API 호출 실패:', error.message);
    }

    clearAuthSession();
    // 마이페이지는 메인 탭 안에 있으므로, 한 단계 위(RootStack)를 가져옴
    const rootNavigation = navigation.getParent();
    // '인증' 묶음(로그인부터 시작)으로 새로 깔아서 뒤로가기로 못 돌아가게 함
    if (rootNavigation) {
      rootNavigation.reset({ index: 0, routes: [{ name: '인증' }] });
    }
  }

  // 로그아웃 버튼을 눌렀을 때 실행 (한 번 더 확인)
  function handlePressLogout() {
    setIsLogoutModalOpen(true);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="마이페이지" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로필 줄 */}
        <TouchableOpacity style={styles.profileRow} onPress={handlePressProfile}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={22} color={TEXT.WEAK} />
          </View>
          <View style={styles.profileTextArea}>
            <Text style={styles.profileName}>{profile.userId}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={TEXT.WEAK} />
        </TouchableOpacity>

        {/* 이용 현황 숫자 3개 */}
        <View style={styles.statRow}>
          <StatBox label="관심 상품" value={String(watchCount)} />
          <View style={styles.statDivider} />
          <StatBox label="목표 달성" value={String(goalCount)} valueColor={POINT.DEFAULT} />
          <View style={styles.statDivider} />
          <StatBox label="받은 알림" value={String(notifications.length)} />
        </View>

        <SectionBand />

        {/* 메뉴 목록을 하나씩 줄로 그림 */}
        {menuList.map(function (menu) {
          // 메뉴 줄을 눌렀을 때 실행
          function handlePressMenuRow() {
            Alert.alert('준비중입니다');
          }

          return (
            <TouchableOpacity key={menu.id} style={styles.menuRow} onPress={handlePressMenuRow}>
              <Text style={styles.menuLabel}>{menu.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={TEXT.WEAK} />
            </TouchableOpacity>
          );
        })}

        <SectionBand />

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutRow} onPress={handlePressLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
      <ConfirmModal
        visible={isLogoutModalOpen}
        title="로그아웃"
        message="정말 로그아웃할까요?"
        cancelText="취소"
        confirmText="로그아웃"
        onCancel={function () {
          setIsLogoutModalOpen(false);
        }}
        onConfirm={handleConfirmLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SURFACE.GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextArea: {
    flex: 1, // 화살표를 오른쪽 끝으로 밀기
    gap: 3,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: TEXT.SUB,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE.DEFAULT,
  },
  // 숫자 사이를 나누는 짧은 세로 선
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: LINE.DEFAULT,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE.DEFAULT,
  },
  menuLabel: {
    flex: 1, // 화살표를 오른쪽 끝으로 밀기
    fontSize: 14,
    color: TEXT.DEFAULT,
    letterSpacing: -0.3,
  },
  logoutRow: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 14,
    color: TEXT.SUB,
  },
});

export default MyPageScreen;
