// 관심 상품 화면. (필터 칩으로 걸러 보고, 정렬 기준으로 순서를 바꿈)

import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import ScreenHeader from '../components/ScreenHeader';
import SectionBand from '../components/SectionBand';
import FilterChips from '../components/FilterChips';
import StatBox from '../components/StatBox';
import ProductCard from '../components/ProductCard';
import SortModal from '../components/SortModal';
import { SURFACE, LINE, TEXT } from '../colors';
import { WatchlistContext } from '../store/WatchlistContext';

// 필터 칩 글자 목록
const filterOptionList = ['전체', '가격 하락', '목표가 임박', '목표가 도달'];

// 정렬 기준 목록 (프론트에서 바로 처리할 수 있는 것들)
const sortOptionList = ['최신순', '오래된순', '최저가순', '가나다순'];

// 관심 상품 화면
function WatchlistScreen() {
  const navigation = useNavigation();

  // 저장소에서 등록된 상품 목록과 알림 토글·삭제 기능을 가져옴
  const { watchedProducts, toggleAlert, removeProduct } = useContext(WatchlistContext);

  // 지금 선택된 필터와 정렬 기준
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [selectedSort, setSelectedSort] = useState('최신순');

  // 정렬 팝업을 열지 여부
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  // 요약 숫자를 등록된 상품으로 계산
  const trackingCount = watchedProducts.length;
  let droppedCount = 0;
  for (let i = 0; i < watchedProducts.length; i = i + 1) {
    if (watchedProducts[i].status === '가격 하락') {
      droppedCount = droppedCount + 1;
    }
  }

  // 우측 상단 종을 눌렀을 때: 알림 탭으로 이동
  function handlePressBell() {
    navigation.navigate('알림');
  }

  // 정렬 팝업을 엶
  function handleOpenSortModal() {
    setIsSortModalOpen(true);
  }

  // 정렬 팝업을 닫음
  function handleCloseSortModal() {
    setIsSortModalOpen(false);
  }

  // 정렬 기준을 골랐을 때: 기준을 바꾸고 팝업을 닫음
  function handleSelectSort(option) {
    setSelectedSort(option);
    setIsSortModalOpen(false);
  }

  function handleCloseDeleteModal() {
    setProductToDelete(null);
    setDeleteMessage('');
  }

  async function handleConfirmDelete() {
    if (productToDelete === null) {
      return;
    }

    try {
      await removeProduct(productToDelete.id);
      handleCloseDeleteModal();
    } catch (error) {
      setDeleteMessage(error.message || '상품 삭제에 실패했습니다.');
    }
  }

  // 선택된 필터에 맞는 상품만 골라냄
  function getFilteredProductList() {
    if (selectedFilter === '전체') {
      return watchedProducts;
    }
    return watchedProducts.filter(function (product) {
      return product.status === selectedFilter;
    });
  }

  // 선택된 정렬 기준으로 순서를 바꿈
  function getSortedProductList(productList) {
    // 원본 목록을 건드리지 않도록 복사본을 만들어 정렬함
    const sortedList = productList.slice();

    // 최신순: 나중에 등록한 상품(id가 큰 상품)이 위로
    if (selectedSort === '최신순') {
      sortedList.sort(function (productA, productB) {
        return productB.id - productA.id;
      });
    }

    // 오래된순: 먼저 등록한 상품(id가 작은 상품)이 위로
    if (selectedSort === '오래된순') {
      sortedList.sort(function (productA, productB) {
        return productA.id - productB.id;
      });
    }

    // 최저가순: 지금 가격이 싼 상품이 위로
    if (selectedSort === '최저가순') {
      sortedList.sort(function (productA, productB) {
        // 최저가를 아직 모르는 상품은 맨 뒤로 보냄
        let priceA = 999999999;
        let priceB = 999999999;
        if (typeof productA.currentLowestPrice === 'number') {
          priceA = productA.currentLowestPrice;
        }
        if (typeof productB.currentLowestPrice === 'number') {
          priceB = productB.currentLowestPrice;
        }
        return priceA - priceB;
      });
    }

    // 가나다순: 상품 이름의 글자 순서대로
    if (selectedSort === '가나다순') {
      sortedList.sort(function (productA, productB) {
        if (productA.name < productB.name) {
          return -1;
        }
        if (productA.name > productB.name) {
          return 1;
        }
        return 0;
      });
    }

    return sortedList;
  }

  // 화면에 실제로 보여줄 목록 (필터 → 정렬 순서로 처리)
  const filteredProductList = getFilteredProductList();
  const visibleProductList = getSortedProductList(filteredProductList);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader
        title="관심 상품"
        rightIconName="notifications-outline"
        onPressRightIcon={handlePressBell}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 요약 숫자 2개 */}
        <View style={styles.statRow}>
          <StatBox label="추적 중" value={String(trackingCount)} />
          <View style={styles.statDivider} />
          <StatBox label="가격 하락" value={String(droppedCount)} />
        </View>

        <SectionBand />

        {/* 필터 칩 (누르면 목록이 다시 걸러짐) */}
        <View style={styles.chipArea}>
          <FilterChips
            options={filterOptionList}
            selectedOption={selectedFilter}
            onSelectOption={setSelectedFilter}
          />
        </View>

        {/* 개수 + 정렬 버튼 */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>총 {String(visibleProductList.length)}개</Text>
          <TouchableOpacity style={styles.sortButton} onPress={handleOpenSortModal}>
            <Text style={styles.sortText}>{selectedSort}</Text>
            <Ionicons name="chevron-down" size={14} color={TEXT.SUB} />
          </TouchableOpacity>
        </View>

        {/* 필터·정렬을 거친 상품을 하나씩 줄로 그림 (서버가 몇 개를 주든 그대로 다 그림) */}
        {visibleProductList.map(function (product) {
          // 이 상품의 종을 눌렀을 때: 저장소의 알림 상태를 뒤집음
          // (저장소를 함께 쓰므로 홈 화면의 같은 상품도 같이 바뀜)
          function handleToggleThisAlert() {
            toggleAlert(product.id);
          }

          // 휴지통 버튼을 눌렀을 때: 정말 지울지 한 번 더 확인
          function handlePressDelete() {
            setProductToDelete(product);
            setDeleteMessage('');
          }

          return (
            <ProductCard
              key={product.id}
              name={product.name}
              mall={product.mall}
              imageUrl={product.imageUrl}
              currentLowestPrice={product.currentLowestPrice}
              targetPrice={product.targetPrice}
              statusLabel={product.status}
              priceHistory={product.priceHistory}
              isAlertOn={product.isAlertOn}
              onToggleAlert={handleToggleThisAlert}
              onDelete={handlePressDelete}
              showGraph
            />
          );
        })}

        {/* 상품이 아예 없을 때 / 필터 결과만 없을 때 각각 안내 */}
        {watchedProducts.length === 0 ? (
          <Text style={styles.emptyText}>
            아직 등록한 상품이 없어요.{'\n'}검색해서 관심 상품을 등록해 보세요.
          </Text>
        ) : null}
        {watchedProducts.length > 0 && visibleProductList.length === 0 ? (
          <Text style={styles.emptyText}>이 상태에 해당하는 상품이 없어요.</Text>
        ) : null}
      </ScrollView>

      {/* 정렬 기준을 고르는 팝업 */}
      <SortModal
        visible={isSortModalOpen}
        options={sortOptionList}
        selectedOption={selectedSort}
        onSelectOption={handleSelectSort}
        onClose={handleCloseSortModal}
      />

      <Modal
        visible={productToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>관심 상품 삭제</Text>
            <Text style={styles.modalMessage}>
              {productToDelete ? productToDelete.name + '을(를) 목록에서 지울까요?' : ''}
            </Text>
            {deleteMessage !== '' ? <Text style={styles.errorText}>{deleteMessage}</Text> : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseDeleteModal}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleConfirmDelete}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE.WHITE,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  // 숫자 사이를 나누는 짧은 세로 선
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: LINE.DEFAULT,
  },
  chipArea: {
    paddingVertical: 12,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  countText: {
    fontSize: 13,
    color: TEXT.SUB,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortText: {
    fontSize: 13,
    color: TEXT.SUB,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT.WEAK,
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 40,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    backgroundColor: SURFACE.WHITE,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT.STRONG,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  modalMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT.SUB,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT.STRONG,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LINE.STRONG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.SUB,
  },
  deleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: TEXT.STRONG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT.INVERSE,
  },
});

export default WatchlistScreen;
