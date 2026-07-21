// 로그인 화면. (앱을 켜면 가장 먼저 보임)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';

import FormInput from '../components/FormInput';
import MessageModal from '../components/MessageModal';
import { loginUser } from '../api/client';
import { setAuthSession } from '../store/AuthSession';
import { SURFACE, LINE, TEXT, POINT, BUTTON } from '../colors';

// 로그인 화면
function LoginScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState({
    visible: false,
    title: '',
    message: '',
    onClose: null,
  });

  function showPopup(title, message, onClose) {
    setPopup({
      visible: true,
      title: title,
      message: message,
      onClose: onClose || null,
    });
  }

  function handleClosePopup() {
    const onClose = popup.onClose;
    setPopup({
      visible: false,
      title: '',
      message: '',
      onClose: null,
    });

    if (onClose) {
      onClose();
    }
  }

  // 로그인 버튼을 눌렀을 때 실행
  async function handlePressLogin() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await loginUser({ userId: userId.trim(), password: password });
      setAuthSession(auth);
      const rootNavigation = navigation.getParent(); // 한 단계 위(RootStack)
      rootNavigation.reset({ index: 0, routes: [{ name: '메인' }] }); // 뒤로가기로 로그인에 못 돌아가게 함
    } catch (error) {
      showPopup('로그인 실패', error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // 회원가입 화면으로 이동
  function handlePressSignup() {
    navigation.navigate('회원가입');
  }

  // 아이디 찾기 화면으로 이동
  function handlePressFindId() {
    navigation.navigate('아이디찾기');
  }

  // 비밀번호 찾기 화면으로 이동
  function handlePressFindPassword() {
    navigation.navigate('비밀번호찾기');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* 앱 이름과 소개 (물음표만 빨간색) */}
        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>
            살까<Text style={styles.logoMark}>?</Text>
          </Text>
          <Text style={styles.logoSubtitle}>최저가 구매 타이밍 알림</Text>
        </View>

        {/* 아이디 / 비밀번호 입력 */}
        <FormInput
          label="아이디"
          value={userId}
          onChangeText={setUserId}
          placeholder="아이디를 입력하세요"
        />
        <FormInput
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호를 입력하세요"
          secureTextEntry
        />

        {/* 로그인 버튼 */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handlePressLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.loginButtonText}>{isSubmitting ? '로그인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        {/* 회원가입 | 아이디 찾기 | 비밀번호 찾기 */}
        <View style={styles.linkRow}>
          <TouchableOpacity onPress={handlePressSignup}>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity onPress={handlePressFindId}>
            <Text style={styles.linkText}>아이디 찾기</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity onPress={handlePressFindPassword}>
            <Text style={styles.linkText}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </View>
      <MessageModal
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        onClose={handleClosePopup}
      />
    </SafeAreaView>
  );
}

LoginScreen.propTypes = {
  navigation: PropTypes.object.isRequired, // 화면 이동 기능
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  container: {
    flex: 1,
    justifyContent: 'center', // 세로 가운데 배치
    paddingHorizontal: 24,
    gap: 20,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  logoTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: TEXT.STRONG,
    letterSpacing: -1.5,
  },
  logoMark: {
    color: POINT.DEFAULT,
  },
  logoSubtitle: {
    fontSize: 13,
    color: TEXT.SUB,
  },
  loginButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: BUTTON.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT.INVERSE,
    letterSpacing: -0.3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 13,
    color: TEXT.SUB,
  },
  // 링크 사이의 짧은 세로 선
  linkDivider: {
    width: 1,
    height: 11,
    backgroundColor: LINE.STRONG,
  },
});

export default LoginScreen;
