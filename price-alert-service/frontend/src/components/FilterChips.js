// 가로로 나열되는 필터 칩 목록입니다. (선택된 칩은 검은 배경이 됨)

import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { SURFACE, LINE, TEXT } from '../colors';

// 필터 칩 줄
function FilterChips({ options, selectedOption, onSelectOption }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {options.map(function (option) {
        // 지금 칩이 선택된 칩인지 여부
        const isSelected = option === selectedOption;

        // 이 칩을 눌렀을 때 실행
        function handlePressChip() {
          onSelectOption(option);
        }

        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected ? styles.chipSelected : null]}
            onPress={handlePressChip}
          >
            <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

FilterChips.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired, // 칩 글자 목록
  selectedOption: PropTypes.string.isRequired, // 선택된 칩 글자
  onSelectOption: PropTypes.func.isRequired, // 칩을 눌렀을 때 실행할 함수
};

const styles = StyleSheet.create({
  // 칩 줄이 자기 좌우 여백을 직접 챙김 (화면 쪽에서 여백을 주지 않아도 됨)
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  chip: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE.STRONG,
    backgroundColor: SURFACE.WHITE,
  },
  // 선택된 칩: 검은 배경 + 흰 글자
  chipSelected: {
    borderColor: TEXT.STRONG,
    backgroundColor: TEXT.STRONG,
  },
  chipText: {
    fontSize: 13,
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
  chipTextSelected: {
    color: TEXT.INVERSE,
    fontWeight: '600',
  },
});

export default FilterChips;
