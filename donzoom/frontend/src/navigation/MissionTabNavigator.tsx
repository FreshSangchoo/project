import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import MissionOngoingScreen from '../views/screens/mission/MissionOngoingScreen';
import MissionCompleteScreen from '../views/screens/mission/MissionCompleteScreen';
import MissionPastScreen from '../views/screens/mission/MissionPastScreen';

import { colors } from '../constants/colors';
import { fonts } from '@/constants/font';

const Tab = createMaterialTopTabNavigator();

export default function MissionTabNavigator({childId}:any) {
  return (
    <Tab.Navigator
      initialRouteName="진행중"
      screenOptions={{
        tabBarActiveTintColor: colors.BLUE_100,
        tabBarInactiveTintColor: colors.BLACK,
        tabBarLabelStyle: {fontFamily: fonts.MEDIUM, fontSize: 16},
        tabBarStyle: {backgroundColor: 'white'},
      }}>
      <Tab.Screen name="진행중" options={{tabBarLabel: '진행중'}}>
        {props => <MissionOngoingScreen {...props} childId={childId} />}
      </Tab.Screen>
      <Tab.Screen name="완료요청" options={{tabBarLabel: '완료요청'}}>
        {props => <MissionCompleteScreen {...props} childId={childId} />}
      </Tab.Screen>
      <Tab.Screen name="지난미션" options={{tabBarLabel: '지난미션'}}>
        {props => <MissionPastScreen {...props} childId={childId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
