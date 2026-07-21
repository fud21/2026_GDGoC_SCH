// 검색 탭 안의 스택. (검색 화면 → 상품 등록 화면)

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/SearchScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

// 검색 → 등록 묶음
function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="검색화면" component={SearchScreen} />
      <Stack.Screen name="상품등록" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default SearchStack;
