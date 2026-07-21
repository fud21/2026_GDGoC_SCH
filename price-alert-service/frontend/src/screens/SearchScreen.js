// 검색 화면. (상품을 검색해 등록 화면으로 넘어감)

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import SectionBand from '../components/SectionBand';
import SearchBar from '../components/SearchBar';
import PlaceholderImage from '../components/PlaceholderImage';
import { SURFACE, LINE, TEXT } from '../colors';
import { formatPrice } from '../utils/priceUtils';
import { fetchProducts } from '../api/client';

function makePopularKeywords(products) {
  const keywordList = [];
  for (let i = 0; i < products.length; i = i + 1) {
    const firstWord = products[i].name.split(' ')[0];
    if (firstWord !== '' && keywordList.includes(firstWord) === false) {
      keywordList.push(firstWord);
    }
    if (keywordList.length >= 6) {
      break;
    }
  }
  return keywordList;
}

// 검색 화면
function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');

  // 인기 검색어와 검색 대상 상품 목록 (백엔드에서 불러옴)
  const [popularKeywords, setPopularKeywords] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);

  // 화면이 처음 그려질 때 데이터를 불러옴
  useEffect(function () {
    async function loadSearchData() {
      try {
        const productList = await fetchProducts();
        setProductCatalog(productList);
        setPopularKeywords(makePopularKeywords(productList));
      } catch (error) {
        Alert.alert('상품 목록 불러오기 실패', error.message);
      }
    }
    loadSearchData();
  }, []);

  // 검색어에 맞는 상품만 골라냄 (검색어가 비어 있으면 전체를 보여줌)
  function getSearchResultList() {
    if (searchText === '') {
      return productCatalog;
    }
    const lowerSearchText = searchText.toLowerCase();
    return productCatalog.filter(function (product) {
      return product.name.toLowerCase().includes(lowerSearchText);
    });
  }

  // 상품을 눌렀을 때: 그 상품 정보를 들고 등록 화면으로 이동
  function handlePressProduct(product) {
    navigation.navigate('상품등록', { product: product });
  }

  // 직접 등록 줄을 눌렀을 때: 빈 등록 화면으로 이동
  function handlePressDirectRegister() {
    navigation.navigate('상품등록');
  }

  // 화면에 실제로 보여줄 검색 결과
  const searchResultList = getSearchResultList();

  // 검색 결과 제목 (검색 중이면 '검색 결과', 아니면 '상품 목록')
  let listTitle = '상품 목록';
  if (searchText !== '') {
    listTitle = '검색 결과';
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* 화면 맨 위에 고정된 검색창 */}
      <View style={styles.searchArea}>
        <SearchBar
          placeholder="상품명, 브랜드, URL 검색"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 인기 검색어 */}
        <View style={styles.keywordSection}>
          <Text style={styles.sectionTitle}>인기 검색어</Text>
          <View style={styles.keywordWrap}>
            {popularKeywords.map(function (keyword) {
              // 검색어를 눌렀을 때: 검색창에 그 검색어를 채워 넣음
              function handlePressKeyword() {
                setSearchText(keyword);
              }

              return (
                <TouchableOpacity
                  key={keyword}
                  style={styles.keywordChip}
                  onPress={handlePressKeyword}
                >
                  <Text style={styles.keywordText}>{keyword}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <SectionBand />

        {/* 검색 결과 제목 + 개수 */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>{listTitle}</Text>
          <Text style={styles.countText}>{String(searchResultList.length)}개</Text>
        </View>

        {/* 검색 결과를 하나씩 줄로 그림 */}
        {searchResultList.map(function (product) {
          // 이 상품을 눌렀을 때 실행
          function handlePressThisProduct() {
            handlePressProduct(product);
          }

          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productRow}
              onPress={handlePressThisProduct}
            >
              <PlaceholderImage size={64} uri={product.imageUrl} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productMall}>{product.mall}</Text>
                <Text style={styles.productPrice}>
                  {typeof product.currentLowestPrice === 'number'
                    ? formatPrice(product.currentLowestPrice)
                    : '-'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={TEXT.WEAK} />
            </TouchableOpacity>
          );
        })}

        {/* 검색 결과가 없을 때 안내 */}
        {searchResultList.length === 0 ? (
          <Text style={styles.emptyText}>검색 결과가 없어요.</Text>
        ) : null}

        <SectionBand />

        {/* 관심 상품 직접 등록 줄 */}
        <TouchableOpacity style={styles.registerRow} onPress={handlePressDirectRegister}>
          <Ionicons name="add" size={20} color={TEXT.STRONG} />
          <Text style={styles.registerText}>관심 상품 직접 등록</Text>
          <Ionicons name="chevron-forward" size={18} color={TEXT.WEAK} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

SearchScreen.propTypes = {
  navigation: PropTypes.object.isRequired, // 화면 이동 기능
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  searchArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE.DEFAULT,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
  keywordSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 12,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap', // 너비를 넘으면 다음 줄로
    gap: 6,
  },
  keywordChip: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE.STRONG,
  },
  keywordText: {
    fontSize: 13,
    color: TEXT.SUB,
    letterSpacing: -0.2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  countText: {
    fontSize: 13,
    color: TEXT.SUB,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE.DEFAULT,
  },
  productInfo: {
    flex: 1, // 화살표를 오른쪽 끝으로 밀기
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT.DEFAULT,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  productMall: {
    fontSize: 12,
    color: TEXT.WEAK,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT.STRONG,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT.WEAK,
    fontSize: 13,
    paddingVertical: 40,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
    gap: 8,
  },
  registerText: {
    flex: 1, // 화살표를 오른쪽 끝으로 밀기
    fontSize: 14,
    fontWeight: '600',
    color: TEXT.STRONG,
    letterSpacing: -0.3,
  },
});

export default SearchScreen;
