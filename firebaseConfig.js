// firebaseConfig.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';


const firebaseConfig = {
  apiKey: "AIzaSyB_x1uvBqjrZXXz63K2JzwjuRilFpKAAys",
  authDomain: "sd-project-4e3f9.firebaseapp.com",
  projectId: "sd-project-4e3f9",
  storageBucket: "sd-project-4e3f9.appspot.com",
  messagingSenderId: "120329407460",
  appId: "1:120329407460:web:d755d1b7a34597908155f1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, GoogleAuthProvider, signInWithPopup };
