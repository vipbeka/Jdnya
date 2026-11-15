import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAin59RYC9_xRPkVHgV5qe6b8sqgth8EqM",
  authDomain: "jadwali-eg.firebaseapp.com",
  projectId: "jadwali-eg",
  storageBucket: "jadwali-eg.firebasestorage.app",
  messagingSenderId: "607156594222",
  appId: "1:607156594222:web:af16c7ce2dea4b9c5c21bf",
  measurementId: "G-802DCK82FN",
};

const app = initializeApp(firebaseConfig);
isSupported()
  .then((ok) => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {});
