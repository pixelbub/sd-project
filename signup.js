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

      //signed-in user info.
      const user = result.user;
      const uid = user.uid;

      //Get the selected role from the dropdown
      const role = document.getElementById("role").value;
      if (!role) {
        alert("Please select a role before continuing.");
        return;
      }

      alert("Signed in with Google!");

      // Send to backend
      fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid, role })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("User added to the database successfully!");
          } else {
            alert("Error saving user: " + (data.error || "Unknown error"));
          }
        })
        .catch(err => {
          console.error("Fetch error:", err);
          alert("Network error: " + err.message);
        });

    })
    .catch(error => {
      alert(error.message);
    });
}

// Expose functions to the global window object
window.signInWithGoogle = signInWithGoogle
