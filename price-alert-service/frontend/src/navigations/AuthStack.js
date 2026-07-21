// 로그인 관련 화면 묶음. (로그인 → 회원가입/아이디찾기/비밀번호찾기)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import FindIdScreen from '../screens/FindIdScreen';
import FindPasswordScreen from '../screens/FindPasswordScreen';

const Stack = createNativeStackNavigator();

// 인증 화면 묶음 (시작은 로그인)
function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="로그인" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="로그인" component={LoginScreen} />
      <Stack.Screen name="회원가입" component={SignupScreen} />
      <Stack.Screen name="아이디찾기" component={FindIdScreen} />
      <Stack.Screen name="비밀번호찾기" component={FindPasswordScreen} />
    </Stack.Navigator>
  );
}

export default AuthStack;
