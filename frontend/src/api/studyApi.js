// src/api/studyApi.js
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

// ── Auth ──────────────────────────────────────────
export const ssoLogin = (idToken, email, extra = {}) =>
  axios.post(`${API_BASE}/auth/sso`, { idToken, email, ...extra });

// ── Studies ───────────────────────────────────────
export const fetchStudies = (params) =>
  axios.get(`${API_BASE}/studies`, { params });

export const fetchStudyDetail = (id) =>
  axios.get(`${API_BASE}/studies/${id}`);

export const createStudy = (payload) =>
  axios.post(`${API_BASE}/studies`, payload);

export const deleteStudy = (studyId, creatorId) =>
  axios.delete(`${API_BASE}/studies/${studyId}?creatorId=${creatorId}`);

export const applyStudy = (studyId, userId) =>
  axios.post(`${API_BASE}/studies/${studyId}/apply?userId=${userId}`);

export const toggleWish = (studyId, userId) =>
  axios.post(`${API_BASE}/studies/${studyId}/wish?userId=${userId}`);

export const approveUser = (studyId, creatorId, userId) =>
  axios.post(`${API_BASE}/studies/${studyId}/approve?creatorId=${creatorId}&userId=${userId}`);

export const rejectUser = (studyId, creatorId, userId) =>
  axios.post(`${API_BASE}/studies/${studyId}/reject?creatorId=${creatorId}&userId=${userId}`);

export const kickMember = (studyId, creatorId, userId) =>
  axios.post(`${API_BASE}/studies/${studyId}/kick?creatorId=${creatorId}&userId=${userId}`);

export const fetchCategoryStats = () =>
  axios.get(`${API_BASE}/studies/categories/stats`);

// ── Users ─────────────────────────────────────────
export const fetchProfile = (userId) =>
  axios.get(`${API_BASE}/users/${userId}/profile`);

export const fetchUserStudies = (userId) =>
  axios.get(`${API_BASE}/users/${userId}/studies`);

export const fetchUserInfo = (userId) =>
  axios.get(`${API_BASE}/users/${userId}/info`);

export const updateProfile = (userId, profileForm) =>
  axios.put(`${API_BASE}/users/${userId}/profile`, profileForm);

export const deleteAccount = (userId) =>
  axios.delete(`${API_BASE}/users/${userId}`);