import { Platform } from 'react-native';
import { decideStatus } from '../utils/priceUtils';

function getDefaultBaseUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  return 'http://localhost:8080';
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl();

function buildUrl(path) {
  return API_BASE_URL + path;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), options);

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;
  if (text !== '') {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    let message = '요청 처리 중 오류가 발생했습니다.';
    if (data && data.message) {
      message = data.message;
    }
    throw new Error(message);
  }

  return data;
}

function mallTypeToLabel(mallType) {
  if (mallType === 'COUPANG') {
    return '쿠팡';
  }
  if (mallType === 'NAVER') {
    return '네이버';
  }
  if (mallType === 'ELEVENST') {
    return '11번가';
  }
  if (mallType === 'GMARKET') {
    return 'G마켓';
  }
  return '기타';
}

function toPriceHistoryValues(priceHistory) {
  return priceHistory.map(function (history) {
    return history.price;
  });
}

function toProduct(product, priceHistory = []) {
  const priceHistoryValues = toPriceHistoryValues(priceHistory);
  let status = '유지 중';

  if (typeof product.currentPrice === 'number' && typeof product.targetPrice === 'number') {
    status = decideStatus(priceHistoryValues, product.currentPrice, product.targetPrice);
  }

  return {
    id: product.id,
    name: product.name,
    url: product.url,
    mall: mallTypeToLabel(product.mallType),
    imageUrl: '',
    currentLowestPrice: product.currentPrice,
    targetPrice: product.targetPrice,
    priceHistory: priceHistoryValues,
    status: status,
    isAlertOn: product.alertEnabled,
    createdAt: product.createdAt,
  };
}

function formatAlertTime(createdAt) {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return '';
  }

  return createdDate.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isToday(createdAt) {
  const createdDate = new Date(createdAt);
  const today = new Date();

  return (
    createdDate.getFullYear() === today.getFullYear() &&
    createdDate.getMonth() === today.getMonth() &&
    createdDate.getDate() === today.getDate()
  );
}

function toNotification(alert) {
  const reachedTarget = alert.triggeredPrice <= alert.targetPrice;
  const isRead = alert.isRead === true || alert.read === true;

  return {
    id: alert.id,
    productId: alert.productId,
    productName: alert.productName,
    message: '가격이 목표가 ' + alert.targetPrice.toLocaleString('ko-KR') + '원 이하로 떨어졌어요!',
    time: formatAlertTime(alert.createdAt),
    isRead: isRead,
    type: reachedTarget ? '목표가 도달' : '가격 하락',
    section: isToday(alert.createdAt) ? '오늘' : '이번 주',
  };
}

export async function fetchProducts() {
  const products = await request('/api/products');
  const productsWithHistory = await Promise.all(
    products.map(async function (product) {
      const priceHistory = await request('/api/products/' + product.id + '/price-history');
      return toProduct(product, priceHistory);
    })
  );

  return productsWithHistory;
}

export async function createProduct(product) {
  const savedProduct = await request('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: product.name,
      url: product.url,
      targetPrice: product.targetPrice,
      alertEnabled: product.alertEnabled,
    }),
  });

  const priceHistory = await request('/api/products/' + savedProduct.id + '/price-history');
  return toProduct(savedProduct, priceHistory);
}

export async function previewPrice(url) {
  const data = await request('/api/price-check/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url }),
  });

  return {
    currentPrice: data.currentPrice,
    mall: mallTypeToLabel(data.mallType),
  };
}

export async function deleteProduct(productId) {
  await request('/api/products/' + productId, { method: 'DELETE' });
}

export async function updateProductAlert(productId, alertEnabled) {
  const updatedProduct = await request('/api/products/' + productId + '/alert-enabled', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertEnabled: alertEnabled }),
  });

  const priceHistory = await request('/api/products/' + updatedProduct.id + '/price-history');
  return toProduct(updatedProduct, priceHistory);
}

export async function fetchNotifications() {
  const alerts = await request('/api/alerts');
  return alerts.map(toNotification);
}

export async function markNotificationAsRead(alertId) {
  const alert = await request('/api/alerts/' + alertId + '/read', { method: 'PATCH' });
  return toNotification(alert);
}

export async function signupUser(user) {
  return request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.userId,
      password: user.password,
      email: user.email,
    }),
  });
}

export async function loginUser(user) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.userId,
      password: user.password,
    }),
  });
}

export async function logoutUser(accessToken) {
  const headers = {};
  if (accessToken) {
    headers.Authorization = 'Bearer ' + accessToken;
  }

  return request('/api/auth/logout', {
    method: 'POST',
    headers: headers,
  });
}
