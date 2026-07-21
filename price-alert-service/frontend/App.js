// 앱 시작점. 내비게이션과 안전영역, 관심 상품 저장소로 전체를 감쌉니다.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootStack from './src/navigations/RootStack';
import WatchlistProvider from './src/store/WatchlistContext';

// 앱 전체 틀
function App() {
  return (
    <SafeAreaProvider>
      <WatchlistProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootStack />
        </NavigationContainer>
      </WatchlistProvider>
    </SafeAreaProvider>
  );
}

export default App;
