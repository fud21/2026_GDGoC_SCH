// 상품 이미지를 보여줍니다. (이미지 주소가 있으면 실제 사진, 없으면 회색 상자)

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { LINE, SURFACE, TEXT } from '../colors';

// 상품 이미지 (또는 회색 자리 상자)
function PlaceholderImage({ size = 64, uri = '' }) {
  const boxSize = { width: size, height: size };

  // 이미지 주소가 있으면 실제 이미지를 보여줌
  if (uri !== '') {
    return <Image source={{ uri: uri }} style={[styles.box, styles.photo, boxSize]} />;
  }

  // 이미지 주소가 없으면 회색 상자에 이미지 아이콘을 보여줌
  return (
    <View style={[styles.box, boxSize]}>
      <Ionicons name="image-outline" size={size * 0.4} color={TEXT.WEAK} />
    </View>
  );
}

PlaceholderImage.propTypes = {
  size: PropTypes.number, // 상자 크기
  uri: PropTypes.string, // 이미지 주소 (없으면 회색 상자)
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: SURFACE.GRAY,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 실제 사진에는 아주 옅은 테두리를 둘러 흰 상품 사진도 경계가 보이게 함
  photo: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE.DEFAULT,
  },
});

export default PlaceholderImage;
