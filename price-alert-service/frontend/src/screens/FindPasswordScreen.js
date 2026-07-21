// 비밀번호 찾기 화면. (아이디·이메일로 임시 비밀번호 찾기)

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';

import ScreenHeader from '../components/ScreenHeader';
import FormInput from '../components/FormInput';
import { SURFACE, LINE, TEXT, BUTTON } from '../colors';

// 비밀번호 찾기 화면
function FindPasswordScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  // 비밀번호 찾기 버튼을 눌렀을 때 실행
  function handlePressFind() {
    // [백엔드 API 자리] 나중에 서버가 아이디·이메일로 임시 비밀번호를 발급. 지금은 로그인으로 돌아감.
    navigation.goBack();
  }

  // iOS에서 키보드가 입력창을 가리지 않게 하는 설정
  let keyboardBehavior;
  if (Platform.OS === 'ios') {
    keyboardBehavior = 'padding';
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="비밀번호 찾기" showBackButton />

      <KeyboardAvoidingView style={styles.keyboardArea} behavior={keyboardBehavior}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formSection}>
            {/* 안내 문구 */}
            <Text style={styles.guideText}>
              가입한 아이디와 이메일을 넣으면 임시 비밀번호를 알려드려요.
            </Text>

            <FormInput
              label="아이디"
              value={userId}
              onChangeText={setUserId}
              placeholder="아이디를 입력하세요"
            />
            <FormInput
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="가입할 때 쓴 이메일을 입력하세요"
              keyboardType="email-address"
            />
          </View>
        </ScrollView>

        {/* 화면 아래에 고정된 찾기 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity style={styles.findButton} onPress={handlePressFind}>
            <Text style={styles.findButtonText}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

FindPasswordScreen.propTypes = {
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
  guideText: {
    fontSize: 13,
    color: TEXT.SUB,
    lineHeight: 19,
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE.DEFAULT,
  },
  findButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: BUTTON.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT.INVERSE,
    letterSpacing: -0.3,
  },
});

export default FindPasswordScreen;
