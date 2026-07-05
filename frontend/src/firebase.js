import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  browserSessionPersistence,
  setPersistence,
  signOut,
  deleteUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAyy_Rzo4_FK1YWL_dKRdQtzvxVYKzalf4',
  authDomain: 'studymate-69ac7.firebaseapp.com',
  projectId: 'studymate-69ac7',
  storageBucket: 'studymate-69ac7.firebasestorage.app',
  messagingSenderId: '470233842626',
  appId: '1:470233842626:web:ce8aa1d1b0cae26f144c5b',
  measurementId: 'G-5ZSXT92LM4',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence); //브라우저 닫으면 로그아웃
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  deleteUser,
};
