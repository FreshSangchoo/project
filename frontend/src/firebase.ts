import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_KEY,
    authDomain: "poppin-5a9bf.firebaseapp.com",
    projectId: "poppin-5a9bf",
    storageBucket: "poppin-5a9bf.appspot.com",
    messagingSenderId: "772015252257",
    appId: "1:772015252257:web:fa7ec49b223f0c40ecd460",
    measurementId: "G-E24Q1E7D3F"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: 'BNN0XvDrV2K_f3a63qbhceL6vDTjwX1lb6JvvUsg-j-VXYklKtXRTN7eV9I3zy0kPRRIM1YHX0Hc0OJUCyDRohI' });
        if (currentToken) {
            console.log('current token for client: ', currentToken);
            // Perform any other neccessary logic here
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('Payload received in onMessageListener: ', payload);
            resolve(payload);
        });
    });

