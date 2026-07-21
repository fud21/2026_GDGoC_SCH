// 하단 탭 5개(홈·검색·알림·관심상품·마이페이지)를 만드는 파일입니다. (시작 탭은 홈)

import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchStack from './SearchStack';
import NotificationScreen from '../screens/NotificationScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import MyPageScreen from '../screens/MyPageScreen';
import { SURFACE, LINE, TEXT, POINT } from '../colors';
import { WatchlistContext } from '../store/WatchlistContext';

const Tab = createBottomTabNavigator();

// 아래 다섯 함수는 각 탭의 아이콘을 그림
// (선택된 탭은 속이 채워진 아이콘, 나머지는 선으로만 그린 아이콘)
function HomeTabIcon({ color, size, focused }) {
  let iconName = 'home-outline';
  if (focused === true) {
    iconName = 'home';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

// 검색 탭 아이콘
function SearchTabIcon({ color, size, focused }) {
  let iconName = 'search-outline';
  if (focused === true) {
    iconName = 'search';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

// 알림 탭 아이콘
function NotificationTabIcon({ color, size, focused }) {
  let iconName = 'notifications-outline';
  if (focused === true) {
    iconName = 'notifications';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

// 관심상품 탭 아이콘
function WatchlistTabIcon({ color, size, focused }) {
  let iconName = 'heart-outline';
  if (focused === true) {
    iconName = 'heart';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

// 마이페이지 탭 아이콘
function MyPageTabIcon({ color, size, focused }) {
  let iconName = 'person-outline';
  if (focused === true) {
    iconName = 'person';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
}

// 하단 탭 묶음
function MainTab() {
  // 저장소에서 알림 목록을 가져와 안 읽은 개수를 셈
  const { notifications } = useContext(WatchlistContext);

  let unreadCount = 0;
  for (let i = 0; i < notifications.length; i = i + 1) {
    if (notifications[i].isRead === false) {
      unreadCount = unreadCount + 1;
    }
  }

  // 안 읽은 알림이 없으면 배지를 아예 표시하지 않음
  let unreadBadge;
  if (unreadCount > 0) {
    unreadBadge = unreadCount;
  }

  return (
    <Tab.Navigator
      initialRouteName="홈"
      screenOptions={{
        headerShown: false, // 기본 헤더 끄고 직접 만든 헤더 사용
        tabBarActiveTintColor: TEXT.STRONG, // 선택된 탭 색 (검정)
        tabBarInactiveTintColor: TEXT.WEAK, // 선택 안 된 탭 색 (흐린 회색)
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen name="홈" component={HomeScreen} options={{ tabBarIcon: HomeTabIcon }} />
      <Tab.Screen name="검색" component={SearchStack} options={{ tabBarIcon: SearchTabIcon }} />
      <Tab.Screen
        name="알림"
        component={NotificationScreen}
        options={{
          tabBarIcon: NotificationTabIcon,
          tabBarBadge: unreadBadge, // 안 읽은 알림 개수 (없으면 표시 안 됨)
          tabBarBadgeStyle: styles.tabBadge,
        }}
      />
      <Tab.Screen
        name="관심상품"
        component={WatchlistScreen}
        options={{ tabBarIcon: WatchlistTabIcon }}
      />
      <Tab.Screen
        name="마이페이지"
        component={MyPageScreen}
        options={{ tabBarIcon: MyPageTabIcon }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: SURFACE.WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE.DEFAULT,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  tabBadge: {
    backgroundColor: POINT.DEFAULT,
    fontSize: 10,
  },
});

export default MainTab;
