import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  deleteProduct as deleteProductFromServer,
  fetchNotifications,
  fetchProducts,
  markNotificationAsRead,
  updateProductAlert,
} from '../api/client';

// 화면들이 꺼내 쓸 저장소를 만듭니다.
export const WatchlistContext = createContext(null);

// 저장소의 실제 값을 담아 아래 화면들에게 나눠주는 컴포넌트
function WatchlistProvider({ children }) {
  // 관심 상품 목록
  const [watchedProducts, setWatchedProducts] = useState([]);

  // 알림 목록
  const [notifications, setNotifications] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 앱이 처음 켜질 때 관심 상품 목록을 불러옴
  useEffect(function () {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const productList = await fetchProducts();
      await loadNotifications();
      setWatchedProducts(productList);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const notificationList = await fetchNotifications();
      setNotifications(notificationList);
      return notificationList;
    } catch (error) {
      setErrorMessage(error.message);
      return [];
    }
  }

  // 관심 상품 하나를 목록 뒤에 추가 (등록 화면에서 사용)
  function addProduct(newProduct) {
    setWatchedProducts(function (previousList) {
      return [newProduct].concat(previousList);
    });
  }

  // 관심 상품 하나를 목록에서 지움 (관심상품 화면의 휴지통 버튼에서 사용)
  async function removeProduct(productId) {
    await deleteProductFromServer(productId);
    setWatchedProducts(function (previousList) {
      // 지울 상품만 빼고 나머지를 새 목록으로 만듦
      return previousList.filter(function (product) {
        return product.id !== productId;
      });
    });
    await loadNotifications();
  }

  // 종 아이콘을 눌렀을 때: 그 상품의 알림 켜짐/꺼짐을 뒤집음
  // (목록을 한곳에서 관리하므로 홈과 관심상품의 종이 함께 바뀝니다)
  async function toggleAlert(productId) {
    const targetProduct = watchedProducts.find(function (product) {
      return product.id === productId;
    });
    if (!targetProduct) {
      return;
    }

    const nextAlertEnabled = !targetProduct.isAlertOn;
    setWatchedProducts(function (previousList) {
      const newList = [];

      // 목록을 하나씩 보면서 누른 상품만 알림 상태를 바꿈
      for (let i = 0; i < previousList.length; i = i + 1) {
        const product = previousList[i];

        if (product.id === productId) {
          // 기존 상품을 복사한 뒤 알림 켜짐/꺼짐만 반대로 바꿈
          const updatedProduct = Object.assign({}, product);
          updatedProduct.isAlertOn = nextAlertEnabled;
          newList.push(updatedProduct);
        } else {
          newList.push(product);
        }
      }

      return newList;
    });

    try {
      const updatedProduct = await updateProductAlert(productId, nextAlertEnabled);
      setWatchedProducts(function (previousList) {
        return previousList.map(function (product) {
          if (product.id === productId) {
            return updatedProduct;
          }
          return product;
        });
      });
      await loadNotifications();
    } catch (error) {
      setErrorMessage(error.message);
      setWatchedProducts(function (previousList) {
        return previousList.map(function (product) {
          if (product.id === productId) {
            const revertedProduct = Object.assign({}, product);
            revertedProduct.isAlertOn = !nextAlertEnabled;
            return revertedProduct;
          }
          return product;
        });
      });
    }
  }

  async function readNotification(notificationId) {
    try {
      const updatedNotification = await markNotificationAsRead(notificationId);
      setNotifications(function (previousList) {
        return previousList.map(function (notification) {
          if (notification.id === notificationId) {
            return updatedNotification;
          }
          return notification;
        });
      });
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // 화면들이 꺼내 쓸 값
  const value = {
    watchedProducts: watchedProducts,
    notifications: notifications,
    isLoading: isLoading,
    errorMessage: errorMessage,
    reloadData: loadInitialData,
    reloadNotifications: loadNotifications,
    addProduct: addProduct,
    removeProduct: removeProduct,
    toggleAlert: toggleAlert,
    readNotification: readNotification,
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

WatchlistProvider.propTypes = {
  children: PropTypes.node, // 이 저장소로 감싸는 화면들
};

export default WatchlistProvider;
