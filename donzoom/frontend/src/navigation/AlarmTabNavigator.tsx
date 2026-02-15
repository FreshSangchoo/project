import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { colors } from '../constants/colors';
import DepositAlarmScreen from '@/views/screens/alarm/DepositAlarmScreen';
import StockAlarmScreen from '@/views/screens/alarm/StockAlarmScreen ';
import MissionAlarmScreen from '@/views/screens/alarm/MissionAlarmScreen';

const Tab = createMaterialTopTabNavigator();

export default function AlarmTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="AlarmScreen" //시작하는 페이지
      screenOptions={{
        tabBarActiveTintColor: colors.BLUE_100,
        tabBarInactiveTintColor: colors.BLACK,
        tabBarLabelStyle: { fontSize: 16 },
        tabBarStyle: { backgroundColor: 'white' },
      }}>
      <Tab.Screen
        name="입출금"
        component={DepositAlarmScreen}
        options={{ tabBarLabel: '입출금' }}
      />
      <Tab.Screen
        name="투자알림"
        component={StockAlarmScreen}
        options={{ tabBarLabel: '투자알림' }}
      />
      <Tab.Screen
        name="미션"
        component={MissionAlarmScreen}
        options={{ tabBarLabel: '미션' }}
      />
    </Tab.Navigator>
  );
}
