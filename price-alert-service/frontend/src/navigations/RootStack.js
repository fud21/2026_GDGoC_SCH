// 최상위 내비게이션. 인증(로그인)이냐 메인(탭)이냐를 정합니다. (시작은 인증)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthStack from './AuthStack';
import MainTab from './MainTab';

const Stack = createNativeStackNavigator();

// 인증 ↔ 메인을 담는 최상위 묶음
function RootStack() {
  return (
    <Stack.Navigator initialRouteName="인증" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="인증" component={AuthStack} />
      <Stack.Screen name="메인" component={MainTab} />
    </Stack.Navigator>
  );
}

export default RootStack;
