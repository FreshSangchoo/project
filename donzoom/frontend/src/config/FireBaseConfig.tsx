import firebase from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyDSUTJysXrGAo2kxrgyEAVNiiVcr4Xfj40',
  authDomain: 'donzoom.firebaseapp.com',
  projectId: 'donzoom',
  storageBucket: 'donzoom.appspot.com',
  messagingSenderId: '1005190129327',
  appId: '1:1005190129327:android:5f3155457bc18b39c7965a',
};

export const initializeFirebase = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  } else {
    console.log('Firebase app already initialized');
  }
};
