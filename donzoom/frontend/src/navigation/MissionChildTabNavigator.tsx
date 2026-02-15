import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import MissionPastChildScreen from '../views/screens/mission/child/MissionPastChildScreen';
import MissionOngoingChildScreen from '../views/screens/mission/child/MissionOngoingChildScreen';
import MissionCompleteChildScreen from '../views/screens/mission/child/MissionCompleteChildScreen';
import { fonts } from '@/constants/font';
import {colors} from '../constants/colors';

const Tab = createMaterialTopTabNavigator();

export default function MissionChildTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="진행중"
      screenOptions={{
        tabBarActiveTintColor: colors.BLUE_100,
        tabBarInactiveTintColor: colors.BLACK,
        tabBarLabelStyle: {fontFamily:fonts.MEDIUM, fontSize: 16},
        tabBarStyle: {backgroundColor: 'white'},
      }}>
      <Tab.Screen
        name="진행중"
        component={MissionOngoingChildScreen}
        options={{tabBarLabel: '진행중'}}
      />
      <Tab.Screen
        name="완료요청"
        component={MissionCompleteChildScreen}
        options={{tabBarLabel: '완료요청'}}
      />
      <Tab.Screen
        name="지난미션"
        component={MissionPastChildScreen}
        options={{tabBarLabel: '지난미션'}}
      />
    </Tab.Navigator>
  );
}
