import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_x1uvBqjrZXXz63K2JzwjuRilFpKAAys",
  authDomain: "sd-project-4e3f9.firebaseapp.com",
  projectId: "sd-project-4e3f9",
  storageBucket: "sd-project-4e3f9.appspot.com",
  messagingSenderId: "120329407460",
  appId: "1:120329407460:web:d755d1b7a34597908155f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign in with Google
function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      const uid = user.uid
      alert("Signed in with Google!");
    })
    .catch(error => {
      alert(error.message);
    });
}

// Expose functions to the global window object
window.signInWithGoogle = signInWithGoogle