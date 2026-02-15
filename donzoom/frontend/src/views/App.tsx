import React, {useCallback, useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClientProvider} from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import firebase from '@react-native-firebase/app';
import queryClient from '@/api/queryClient';
import RootNavigator from '@/navigation/root/RootNavigator';
import {useSignupStore} from '@/stores/useAuthStore';
import {RefreshControl, ScrollView} from 'react-native';
import useFCMStore from '@/stores/useFCMStore';

const firebaseConfig = {
  apiKey: 'AIzaSyDSUTJysXrGAo2kxrgyEAVNiiVcr4Xfj40',
  authDomain: 'donzoom.firebaseapp.com',
  projectId: 'donzoom',
  storageBucket: 'donzoom.appspot.com',
  messagingSenderId: '1005190129327',
  appId: '1:1005190129327:android:5f3155457bc18b39c7965a',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig); // Firebase 초기화
} else {
  console.log('Firebase app already initialized');
}

function App() {
  // const [refreshing, setRefreshing] = useState(false);

  // const onRefresh = useCallback(() => {
  //   setRefreshing(true);
  //   setTimeout(() => {
  //     setRefreshing(false);
  //   }, 200);
  // }, []);

  const getToken = async () => {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  };

  const {setToken} = useFCMStore();

  getToken(); // 앱이 시작될 때 토큰 확인

  useEffect(() => {
    // 알림 채널 생성 (앱이 시작될 때)
    const createNotificationChannel = async () => {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    };

    createNotificationChannel();

    // 푸시 알림 권한 요청
    const requestPermission = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    // 앱이 포그라운드에 있을 때 메시지를 처리
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground FCM Message:', remoteMessage);

      await notifee.displayNotification({
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
      setToken('asdf');
    });

    // 백그라운드 메시지 처리
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background FCM Message:', remoteMessage);
    });

    return unsubscribe; // 컴포넌트 언마운트 시 구독 해제
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {/* <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <RootNavigator />
        </ScrollView> */}
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
