// 라벨 + 입력칸 한 세트. (로그인·회원가입 등에서 공통 사용)
// 입력칸은 네모 상자 대신 아래쪽 밑줄만 그어 깔끔하게 보이게 합니다.

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { LINE, TEXT } from '../colors';

// 라벨 + 입력칸
function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={TEXT.WEAK}
        secureTextEntry={secureTextEntry} // true면 글자를 ●●●로 가림
        keyboardType={keyboardType}
        autoCapitalize="none" // 첫 글자 대문자 자동변환 끄기
      />
    </View>
  );
}

FormInput.propTypes = {
  label: PropTypes.string.isRequired, // 설명 글자
  value: PropTypes.string.isRequired, // 입력된 값
  onChangeText: PropTypes.func.isRequired, // 값이 바뀔 때 실행할 함수
  placeholder: PropTypes.string.isRequired, // 안내 문구
  secureTextEntry: PropTypes.bool, // 글자를 가릴지 여부
  keyboardType: PropTypes.string, // 키보드 종류
};

const styles = StyleSheet.create({
  group: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: LINE.STRONG,
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT.STRONG,
  },
});

export default FormInput;
