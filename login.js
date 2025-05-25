
// login.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Use the same Firebase config as in your sign-up code.
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

function signInWithGoogleLogin() {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      const uid = user.uid;
      
      // Call your backend endpoint to check for the user's record.
      fetch(`https://backend-k52m.onrender.com/users/${uid}`, {
        method: 'GET',
        mode: 'cors'
      })
      .then(async res => {
        if (res.ok) {
          if (user) {
            localStorage.setItem('user_uid', user.uid);
            localStorage.setItem('first_name', user.displayName.split(" ")[0]);
            localStorage.setItem('user_role', data.role); 

        
          }
          const data = await res.json();
          alert(`Welcome back, ${data.first_name}!`);
           if (data.role == "admin"){
            if (data.status == "pending"){
              alert("Your account is still pending approval. .")
                window.location.href = `dashboard.html?first_name=${encodeURIComponent(data.first_name)}`;
                return; 
            } else if (data.status == "active"){
              //alert("Welcome admin, you can manage the users now.");
              window.location.href = `a_dashboard.html?first_name=${encodeURIComponent(data.first_name)}`;
              return;
            }else if(data.status == "blocked"){
              alert("Your account has been blocked. Please contact support.");
              return;}
            
          }
          else if (data.role =="facility-staff"){
              if (data.status == "pending"){
                alert("Your account is still pending approval. .")
                  window.location.href = `dashboard.html?first_name=${encodeURIComponent(data.first_name)}`;
                  return; 
                }else if(data.status == "blocked"){
                  alert("Your account has been blocked. Please contact support.");
                  return;}
              else if (data.status == "active"){ //alert("Welcome facility staff, you can manage the patients now.");
                window.location.href = `staffHome.html?first_name=${encodeURIComponent(data.first_name)}`;
                return;}
           
          }else if(data.role =="resident") {
            if(data.status == "blocked"){
              alert("Your account has been blocked. Please contact support.");
              return;}else{window.location.href = `dashboard.html?first_name=${encodeURIComponent(data.first_name)}`;
              return;}
            // Pass the first name to the dashboard. You can use session storage,
          // query parameters, or any client-side method to display the user's name.
            
           }
          
          
        } else {
          // If the user is not found, advise sign up.
          const errorData = await res.json();
          alert(errorData.error || "User not found, please sign up.");
          window.location.href = "testsignup.html";
        }
      })
      .catch(err => {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
      });
    })
    .catch(error => {
      console.error("Sign in error:", error);
      alert("Sign in error: " + error.message);
    });
}

// Expose the login function for the HTML button.
window.signInWithGoogleLogin = signInWithGoogleLogin;
