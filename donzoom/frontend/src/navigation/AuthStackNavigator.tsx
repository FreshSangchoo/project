import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AuthHomeScreen from '../views/screens/auth/AuthHomeScreen';
import LoginScreen from '../views/screens/auth/LoginScreen';
import SignupScreen from '../views/screens/auth/SignupScreen';
import CheckFamilyScreen from '@/views/screens/auth/CheckFamilyScreen';
import NickNameScreen from '@/views/screens/auth/NickNameScreen';
import AccountHistoryScreen from '@/views/screens/account/AccountHistoryScreen';
import {Text, TouchableOpacity} from 'react-native';
import Footer from './Footer';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';

const Stack = createNativeStackNavigator();

const AuthStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AuthHome" component={AuthHomeScreen} />
      <Stack.Screen name="회원가입" component={SignupScreen} />
      <Stack.Screen name="부모/아이 설정" component={CheckFamilyScreen} />
      <Stack.Screen name="닉네임 설정" component={NickNameScreen} />
      <Stack.Screen
        name="Footer"
        component={Footer}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};
export default AuthStackNavigator;
