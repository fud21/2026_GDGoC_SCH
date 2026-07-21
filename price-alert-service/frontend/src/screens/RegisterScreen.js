// 관심 상품 등록 화면. (검색으로 고른 상품을 채워 넣거나, 직접 입력해서 등록)

import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import PropTypes from 'prop-types';

import ScreenHeader from '../components/ScreenHeader';
import SectionBand from '../components/SectionBand';
import PlaceholderImage from '../components/PlaceholderImage';
import FormInput from '../components/FormInput';
import { SURFACE, LINE, TEXT, BUTTON } from '../colors';
import { WatchlistContext } from '../store/WatchlistContext';
import { parsePrice, formatPrice } from '../utils/priceUtils';
import { createProduct, previewPrice } from '../api/client';

// 관심 상품 등록 화면
function RegisterScreen({ navigation, route }) {
  // 관심 상품 저장소에서 '추가' 기능을 가져옴
  const { addProduct, reloadNotifications } = useContext(WatchlistContext);

  // 입력창 값들
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [mallName, setMallName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');

  // 상품 이미지와 현재 최저가 (버튼을 누르면 서버에서 다시 받아와 바뀔 수 있음)
  const [imageUrl, setImageUrl] = useState('');
  const [currentLowestPrice, setCurrentLowestPrice] = useState(null);

  // 목표가 이하 알림 스위치의 켜짐 여부
  const [isAlertOn, setIsAlertOn] = useState(true);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [resultPopup, setResultPopup] = useState({
    visible: false,
    title: '',
    message: '',
    shouldGoToWatchlist: false,
  });

  function resetForm(product) {
    if (product) {
      setProductName(product.name || '');
      setProductUrl(product.url || '');
      setMallName(product.mall || '');
      setImageUrl(product.imageUrl || '');
      setCurrentLowestPrice(product.currentLowestPrice || null);
    } else {
      setProductName('');
      setProductUrl('');
      setMallName('');
      setImageUrl('');
      setCurrentLowestPrice(null);
    }
    setTargetPrice('');
    setIsAlertOn(true);
    setIsCheckingPrice(false);
    setIsRegistering(false);
  }

  function showResultPopup(title, message, shouldGoToWatchlist) {
    setResultPopup({
      visible: true,
      title: title,
      message: message,
      shouldGoToWatchlist: shouldGoToWatchlist,
    });
  }

  function handleCloseResultPopup() {
    const shouldGoToWatchlist = resultPopup.shouldGoToWatchlist;
    setResultPopup({
      visible: false,
      title: '',
      message: '',
      shouldGoToWatchlist: false,
    });

    if (shouldGoToWatchlist) {
      handleGoToWatchlist();
    }
  }

  useFocusEffect(
    useCallback(
      function () {
        const selectedProduct = route.params && route.params.product ? route.params.product : null;
        resetForm(selectedProduct);

        return function () {
          resetForm(null);
        };
      },
      [route.params]
    )
  );

  // 최저가가 숫자면 '239,000원'처럼, 아직 없으면 '-'로 표시
  let currentLowestPriceText = '-';
  if (typeof currentLowestPrice === 'number') {
    currentLowestPriceText = formatPrice(currentLowestPrice);
  }

  // 이미지 검색 버튼을 눌렀을 때: 서버에서 상품 이미지를 찾아옴
  function handlePressImageSearch() {
    // [백엔드 ⑦] 아래 주석을 풀고 서버 주소만 넣으세요.
    //
    // async function loadProductImage() {
    //   const response = await fetch('여기에_서버주소/api/products/image?name=' + productName);
    //   const data = await response.json();
    //   setImageUrl(data.imageUrl);
    // }
    // loadProductImage();

    Alert.alert('준비중입니다'); // 더미: 연동 시 삭제
  }

  // 다시 확인 버튼을 눌렀을 때: 서버에서 지금 최저가를 다시 불러옴
  async function handlePressCheckPrice() {
    if (productUrl === '') {
      showResultPopup('가격 확인 실패', '상품 URL을 먼저 입력해주세요.', false);
      return;
    }

    try {
      setIsCheckingPrice(true);
      const priceResult = await previewPrice(productUrl);
      setCurrentLowestPrice(priceResult.currentPrice);
      setMallName(priceResult.mall);
      Alert.alert('가격 확인 완료', '현재 최저가를 확인했어요.');
    } catch (error) {
      showResultPopup('가격 확인 실패', error.message || '현재 최저가를 확인하지 못했습니다.', false);
    } finally {
      setIsCheckingPrice(false);
    }
  }

  // 등록을 마친 뒤 관심상품 탭으로 이동
  function handleGoToWatchlist() {
    resetForm(null);
    navigation.navigate('검색화면'); // 등록 화면을 닫아 검색 화면으로 돌아감
    const mainTab = navigation.getParent(); // 한 단계 위(탭 묶음)
    mainTab.navigate('관심상품'); // 관심상품 탭으로 이동
  }

  // 등록하기 버튼을 눌렀을 때 실행
  async function handlePressRegister() {
    if (isRegistering) {
      return;
    }

    // 빈칸이 있으면 안내하고 멈춤
    if (productName === '') {
      showResultPopup('등록 실패', '상품명을 입력해주세요.', false);
      return;
    }
    if (targetPrice === '') {
      showResultPopup('등록 실패', '목표 가격을 입력해주세요.', false);
      return;
    }
    if (productUrl === '') {
      showResultPopup('등록 실패', '상품 URL을 입력해주세요.', false);
      return;
    }

    // 목표가 글자를 숫자로 바꿈
    const targetNumber = parsePrice(targetPrice);
    if (targetNumber <= 0) {
      showResultPopup('등록 실패', '목표 가격은 0보다 큰 숫자로 입력해주세요.', false);
      return;
    }

    // 저장소에 추가할 새 관심 상품 (id는 지금 시각으로 겹치지 않게 만듦)
    const newProduct = {
      name: productName,
      url: productUrl,
      targetPrice: targetNumber,
      alertEnabled: isAlertOn,
    };

    try {
      setIsRegistering(true);
      const savedProduct = await createProduct(newProduct);
      addProduct(savedProduct);
      await reloadNotifications();

      showResultPopup('등록 완료', '등록 완료되었습니다.', true);
    } catch (error) {
      showResultPopup('등록 실패', error.message || '등록이 안 되었습니다.', false);
    } finally {
      setIsRegistering(false);
    }
  }

  // iOS에서 키보드가 입력창을 가리지 않게 하는 설정
  let keyboardBehavior;
  if (Platform.OS === 'ios') {
    keyboardBehavior = 'padding';
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="관심 상품 등록" showBackButton />

      <KeyboardAvoidingView style={styles.keyboardArea} behavior={keyboardBehavior}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 상품 이미지 */}
          <View style={styles.imageSection}>
            <PlaceholderImage size={72} uri={imageUrl} />
            <View style={styles.imageTextArea}>
              <Text style={styles.imageTitle}>상품 이미지</Text>
              <Text style={styles.imageDescription}>
                검색으로 상품을 고르면 이미지가 자동으로 들어옵니다.
              </Text>
              <TouchableOpacity style={styles.imageSearchButton} onPress={handlePressImageSearch}>
                <Ionicons name="search" size={13} color={TEXT.SUB} />
                <Text style={styles.imageSearchText}>이미지 검색</Text>
              </TouchableOpacity>
            </View>
          </View>

          <SectionBand />

          {/* 상품 정보 입력 */}
          <View style={styles.formSection}>
            <FormInput
              label="상품명"
              value={productName}
              onChangeText={setProductName}
              placeholder="상품 이름을 입력하세요"
            />
            <FormInput
              label="상품 URL"
              value={productUrl}
              onChangeText={setProductUrl}
              placeholder="상품 페이지 주소를 붙여넣으세요"
            />
            <FormInput
              label="쇼핑몰"
              value={mallName}
              onChangeText={setMallName}
              placeholder="쇼핑몰 이름을 입력하세요"
            />
          </View>

          <SectionBand />

          {/* 현재 최저가 (백엔드에서 불러옴) */}
          <View style={styles.priceSection}>
            <View style={styles.priceLabelRow}>
              <Text style={styles.priceLabel}>현재 최저가</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handlePressCheckPrice}
                disabled={isCheckingPrice}
              >
                <Ionicons name="refresh" size={13} color={TEXT.SUB} />
                <Text style={styles.refreshText}>{isCheckingPrice ? '확인 중' : '다시 확인'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.priceValue}>{currentLowestPriceText}</Text>
          </View>

          <SectionBand />

          {/* 목표 가격 입력 */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>목표 가격</Text>
            <View style={styles.targetPriceRow}>
              <TextInput
                style={styles.targetPriceInput}
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="목표 가격"
                placeholderTextColor={TEXT.WEAK}
                keyboardType="number-pad"
              />
              <Text style={styles.wonText}>원</Text>
            </View>
            <Text style={styles.helperText}>
              현재 최저가보다 낮게 설정하면 가격이 내려갈 때 알림을 드려요.
            </Text>
          </View>

          <SectionBand />

          {/* 목표가 이하 알림 스위치 */}
          <View style={styles.alertRow}>
            <View style={styles.alertTextArea}>
              <Text style={styles.alertTitle}>목표가 이하 알림</Text>
              <Text style={styles.alertDescription}>목표가 아래로 내려가면 알림을 받습니다.</Text>
            </View>
            <Switch
              value={isAlertOn}
              onValueChange={setIsAlertOn}
              trackColor={{ false: LINE.STRONG, true: TEXT.STRONG }}
              thumbColor={SURFACE.WHITE}
              ios_backgroundColor={LINE.STRONG}
            />
          </View>
        </ScrollView>

        {/* 화면 아래에 고정된 등록 버튼 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handlePressRegister}
            disabled={isRegistering}
          >
            <Text style={styles.registerButtonText}>{isRegistering ? '등록 중' : '등록하기'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={resultPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseResultPopup}
      >
        <View style={styles.popupBackdrop}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>{resultPopup.title}</Text>
            <Text style={styles.popupMessage}>{resultPopup.message}</Text>
            <TouchableOpacity style={styles.popupButton} onPress={handleCloseResultPopup}>
              <Text style={styles.popupButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

RegisterScreen.propTypes = {
  navigation: PropTypes.object.isRequired, // 화면 이동 기능
  route: PropTypes.object.isRequired, // 화면으로 넘어온 정보 (고른 상품 등)
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  keyboardArea: {
    flex: 1,
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
  },
  imageTextArea: {
    flex: 1,
    gap: 4,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  imageDescription: {
    fontSize: 12,
    color: TEXT.SUB,
    lineHeight: 17,
  },
  imageSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // 글자 길이만큼만 차지
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: LINE.STRONG,
    gap: 4,
    marginTop: 4,
  },
  imageSearchText: {
    fontSize: 12,
    color: TEXT.SUB,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
  priceSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 6,
  },
  priceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: LINE.STRONG,
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: TEXT.SUB,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT.STRONG,
    letterSpacing: -0.8,
  },
  targetPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: LINE.STRONG,
    marginTop: -12, // 라벨과의 간격을 다른 입력칸과 맞춤
  },
  targetPriceInput: {
    flex: 1, // '원'을 뺀 나머지 공간 차지
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT.STRONG,
  },
  wonText: {
    fontSize: 15,
    color: TEXT.SUB,
  },
  helperText: {
    fontSize: 12,
    color: TEXT.WEAK,
    lineHeight: 17,
    marginTop: -12, // 입력칸과의 간격을 좁힘
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
  },
  alertTextArea: {
    flex: 1, // 스위치를 오른쪽 끝으로 밀기
    gap: 3,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  alertDescription: {
    fontSize: 12,
    color: TEXT.SUB,
  },
  // 스크롤과 상관없이 화면 아래에 항상 붙어 있는 버튼 칸
  bottomArea: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: SURFACE.WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE.DEFAULT,
  },
  registerButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: BUTTON.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT.INVERSE,
    letterSpacing: -0.3,
  },
  popupBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  popupBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    backgroundColor: SURFACE.WHITE,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT.STRONG,
    letterSpacing: -0.4,
  },
  popupMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT.SUB,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  popupButton: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 8,
    backgroundColor: BUTTON.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  popupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.INVERSE,
    letterSpacing: -0.2,
  },
});

export default RegisterScreen;
