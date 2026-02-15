import React from 'react';
import {StyleSheet, Text, View,SafeAreaView} from 'react-native';
import MissionProfile from '../../../components/MissionProfile';
import MissionChildTabNavigator from '@/navigation/MissionChildTabNavigator';
import {colors} from '@/constants/colors';
import { useSignupStore } from '@/stores/useAuthStore';
import useMissionStore from '@/stores/useMissionStore';

const MissionHomeChildScreen = ({route}:any) => {
  const profile = route.params.profile;
  const setChildId = useMissionStore(state => state.setChildId);
  setChildId(profile.id)

  return (
    <SafeAreaView style={styles.container}>
      <MissionProfile name={profile.name} />
      <MissionChildTabNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: colors.WHITE,
  },
});

export default MissionHomeChildScreen;
