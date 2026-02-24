importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_KEY,
    authDomain: "poppin-5a9bf.firebaseapp.com",
    projectId: "poppin-5a9bf",
    storageBucket: "poppin-5a9bf.appspot.com",
    messagingSenderId: "772015252257",
    appId: "1:772015252257:web:fa7ec49b223f0c40ecd460",
    measurementId: "G-E24Q1E7D3F"
});

const messaging = firebase.messaging();

