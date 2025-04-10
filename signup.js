// signup.js
import { auth, GoogleAuthProvider, signInWithPopup } from './firebaseConfig.js';

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider)
    .then(result => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      alert("Signed in with Google!");
      return user;
    })
    .catch(error => {
      alert(error.message);
      throw error;
    });
}

// Optional: expose to browser if needed
if (typeof window !== 'undefined') {
  window.signInWithGoogle = signInWithGoogle;
}
