// signup.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

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
  console.log("Starting sign in with Google.");
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => {
      // Extract user data and token from Google response.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      const uid = user.uid;

      // Get the selected role from the dropdown.
      const first_name = document.getElementById("first-name").value;
      const last_name = document.getElementById("last-name").value;
      const role = document.getElementById("role").value;
      if (!role) {
        alert("Please select a role before continuing.");
        return;
      }
      

      if (!role) {
        alert("Please select a role before continuing.");
        return;
      }

      alert("Signed in with Google!");

      // Send UID and role to the backend.
      console.log("Selected role:", role);
      fetch('https://backend-k52m.onrender.com/users', {
        method: 'POST',
        mode: 'cors', // Explicitly set CORS mode.
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid, role , first_name, last_name })  // Include firstname and lastname in the request body.
      })
        .then(async res => {
          console.log("Response received from server:", res);
          // Check if response is JSON.
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (res.ok) {
              alert("User added to the database successfully!");
              alert(`Welcome, ${data.first_name}!`);
    
              // Redirect based on role
              if (role == "admin") {
                window.location.href = `a_sHome.html?firstname=${encodeURIComponent(first_name)}`;
              } else if (role == "facility-staff") {
                console.log("Redirecting to staff home page.");
                window.location.href = `staffHome.html?firstname=${encodeURIComponent(first_name)}`;
              } else if (role == "resident") {
                window.location.href = `dashboard.html?firstname=${encodeURIComponent(first_name)}`;
              } else {
                alert("Unknown role! Cannot redirect.");
              }
            } else {
              // Handle specific error messages
              if (data.error && data.error.includes("User already exists")) {
                alert("User already exists. Please log in instead.");
                window.location.href = "index.html";
                
                
              } else {
                alert("Error saving user: " + (data.error || "Unknown error"));
              }
            }
          } else {
            const text = await res.text();
            throw new Error('Server returned non-JSON response: ' + text);
          }
        })
        .catch(err => {
          console.error("Fetch error:", err);
          alert("Network error: " + err.message);
        });
    })
    .catch(error => {
      // Captures errors from signInWithPopup.
      alert(error.message);
    });
}

// Expose the signInWithGoogle function to the global window object so that the HTML button can access it.
window.signInWithGoogle = signInWithGoogle;
