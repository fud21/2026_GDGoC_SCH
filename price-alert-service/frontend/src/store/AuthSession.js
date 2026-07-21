// 앱 실행 중 로그인한 사용자 정보를 보관합니다.

let currentAuth = null;

export function setAuthSession(auth) {
  currentAuth = auth;
}

export function getAuthSession() {
  return currentAuth;
}

export function getCurrentUser() {
  if (!currentAuth) {
    return null;
  }

  return currentAuth.user;
}

export function clearAuthSession() {
  currentAuth = null;
}
