import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBS8Fg-vQiu99H--dP3RFbbRxUaCyA9Hqs",
    authDomain: "react-js-learning-platform.firebaseapp.com",
    projectId: "react-js-learning-platform",
    storageBucket: "react-js-learning-platform.firebasestorage.app",
    messagingSenderId: "122322102937",
    appId: "1:122322102937:web:6b89898057e024f1faa608"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();