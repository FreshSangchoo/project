import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainScreen from '@/views/screens/main/MainScreen';
import {View} from 'react-native';

const Stack = createNativeStackNavigator();

const MainNavigator = ({}) => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainScreen" component={MainScreen} />
    </Stack.Navigator>
  );
};
export default MainNavigator;
