import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MissionProfile from '../../components/MissionProfile';
import MissionTabNavigator from '../../../navigation/MissionTabNavigator';
import { colors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import useMissionStore from '@/stores/useMissionStore';

const MissionHomeScreen = () => {
  const childName = useMissionStore(state => state.getChildName());
  const childId = useMissionStore(state => state.getChildId());
  return (
    <SafeAreaView style={styles.container}>
      <MissionProfile name={childName ? `${childName}의 미션 현황` : '선택된 아이가 없습니다'} />
      <MissionTabNavigator childId={childId} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', 
    alignItems: 'stretch', 
    backgroundColor:colors.WHITE,
  },
});

export default MissionHomeScreen;
