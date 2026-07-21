// 회원가입 화면. (아이디·비밀번호·이메일 입력)

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';

import ScreenHeader from '../components/ScreenHeader';
import FormInput from '../components/FormInput';
import MessageModal from '../components/MessageModal';
import { signupUser } from '../api/client';
import { SURFACE, LINE, TEXT, BUTTON } from '../colors';

// 회원가입 화면
function SignupScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
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

  // 가입하기 버튼을 눌렀을 때 실행
  async function handlePressSignup() {
    if (isSubmitting) {
      return;
    }
    if (password !== passwordConfirm) {
      showPopup('회원가입 실패', '비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signupUser({
        userId: userId.trim(),
        password: password,
        email: email.trim(),
      });
      showPopup('회원가입 완료', '로그인해 주세요.', function () {
        navigation.navigate('로그인');
      });
    } catch (error) {
      showPopup('회원가입 실패', error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // iOS에서 키보드가 입력창을 가리지 않게 하는 설정
  let keyboardBehavior;
  if (Platform.OS === 'ios') {
    keyboardBehavior = 'padding';
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="회원가입" showBackButton />

      <KeyboardAvoidingView style={styles.keyboardArea} behavior={keyboardBehavior}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formSection}>
            <FormInput
              label="아이디"
              value={userId}
              onChangeText={setUserId}
              placeholder="사용할 아이디를 입력하세요"
            />
            <FormInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
            />
            <FormInput
              label="비밀번호 확인"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호를 한 번 더 입력하세요"
              secureTextEntry
            />
            <FormInput
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력하세요"
              keyboardType="email-address"
            />
          </View>
        </ScrollView>

        {/* 화면 아래에 고정된 가입 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={handlePressSignup}
            disabled={isSubmitting}
          >
            <Text style={styles.signupButtonText}>{isSubmitting ? '가입 중...' : '가입하기'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <MessageModal
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        onClose={handleClosePopup}
      />
    </SafeAreaView>
  );
}

SignupScreen.propTypes = {
  navigation: PropTypes.object.isRequired, // 화면 이동 기능
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  keyboardArea: {
    flex: 1,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 22,
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE.DEFAULT,
  },
  signupButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: BUTTON.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT.INVERSE,
    letterSpacing: -0.3,
  },
});

export default SignupScreen;
