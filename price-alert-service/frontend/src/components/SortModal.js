// 정렬 기준을 고르는 팝업입니다. (화면 아래에서 올라오는 방식)

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SURFACE, LINE, TEXT } from '../colors';

// 정렬 선택 팝업
function SortModal({ visible, options, selectedOption, onSelectOption, onClose }) {
  // 팝업 안쪽을 눌렀을 때는 닫히지 않게 함 (아무것도 하지 않음)
  function handlePressInside() {
    return;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* 어두운 배경: 누르면 팝업이 닫힘 */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        {/* 아래에 붙는 흰색 팝업 */}
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={handlePressInside}>
          <View style={styles.handle} />
          <Text style={styles.title}>정렬</Text>

          {options.map(function (option) {
            // 지금 그리고 있는 줄이 선택된 정렬인지 확인
            const isSelected = option === selectedOption;

            // 이 줄을 눌렀을 때 실행
            function handlePressOption() {
              onSelectOption(option);
            }

            return (
              <TouchableOpacity key={option} style={styles.row} onPress={handlePressOption}>
                <Text style={[styles.rowText, isSelected ? styles.rowTextSelected : null]}>
                  {option}
                </Text>
                {isSelected ? (
                  <Ionicons name="checkmark" size={18} color={TEXT.STRONG} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

SortModal.propTypes = {
  visible: PropTypes.bool.isRequired, // 팝업을 보여줄지 여부
  options: PropTypes.arrayOf(PropTypes.string).isRequired, // 정렬 기준 목록
  selectedOption: PropTypes.string.isRequired, // 지금 선택된 정렬 기준
  onSelectOption: PropTypes.func.isRequired, // 정렬을 골랐을 때 실행할 함수
  onClose: PropTypes.func.isRequired, // 팝업을 닫을 때 실행할 함수
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 반투명 검은 배경
    justifyContent: 'flex-end', // 팝업을 화면 아래에 붙임
  },
  sheet: {
    backgroundColor: SURFACE.WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  // 팝업 맨 위의 짧은 회색 손잡이 (아래에서 올라온 창임을 알려줌)
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINE.STRONG,
    alignSelf: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    color: TEXT.SUB,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 글자는 왼쪽, 체크는 오른쪽
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE.DEFAULT,
  },
  rowText: {
    fontSize: 15,
    color: TEXT.DEFAULT,
    letterSpacing: -0.3,
  },
  rowTextSelected: {
    color: TEXT.STRONG,
    fontWeight: '700',
  },
});

export default SortModal;
