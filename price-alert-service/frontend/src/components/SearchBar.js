// 돋보기가 붙은 검색창입니다.
// onPress를 받으면 '누르면 다른 화면으로 넘어가는 검색창'이 되고, 안 받으면 직접 입력하는 검색창이 됩니다.

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SURFACE, TEXT } from '../colors';

// 검색창
function SearchBar({ placeholder, value = '', onChangeText = null, onPress = null }) {
  // 누르면 검색 화면으로 넘어가는 검색창 (홈에서 사용)
  if (onPress !== null) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <Ionicons name="search" size={18} color={TEXT.WEAK} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  // 글자를 직접 입력하는 검색창 (검색 화면에서 사용)
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={TEXT.WEAK} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={TEXT.WEAK}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

SearchBar.propTypes = {
  placeholder: PropTypes.string.isRequired, // 안내 문구
  value: PropTypes.string, // 입력된 글자
  onChangeText: PropTypes.func, // 글자가 바뀔 때 실행할 함수
  onPress: PropTypes.func, // 검색창을 눌렀을 때 실행할 함수 (있으면 입력이 아니라 이동용이 됨)
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE.GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1, // 돋보기를 뺀 나머지 공간 차지
    fontSize: 14,
    color: TEXT.STRONG,
    paddingVertical: 0, // 안드로이드 기본 여백 제거
  },
  placeholder: {
    fontSize: 14,
    color: TEXT.WEAK,
  },
});

export default SearchBar;
