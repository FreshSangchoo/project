import {fonts} from '@/constants/font';
import {colors} from '@/constants/colors';
import {ScrollView, StyleSheet, View} from 'react-native';

import {useSignupStore} from '@/stores/useAuthStore';
import ParentsMainScreen from './main/ParentsMainScreen';
import ChildrenMainScreen from './main/ChildrenMainScreen';
import {useCallback, useState} from 'react';
import {RefreshControl} from 'react-native';

function HomeScreen() {
  const {isParent} = useSignupStore();
  // const isParent = false;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.container}>
        <View style={styles.contentsContainer}>
          {isParent ? <ParentsMainScreen /> : <ChildrenMainScreen />}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
    alignItems: 'center',
  },
  contentsContainer: {
    padding: 20,
  },
  profileContainer: {},
  mypageContainer: {
    width: 350,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  mypageAlarm: {
    flexDirection: 'row',
  },
  mypageSetting: {
    flexDirection: 'row',
  },
  mypageText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 13,
  },
  icon: {
    color: colors.BLACK,
    marginHorizontal: 5,
  },
  moneyContainer: {
    width: 360,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.YELLOW_75,
    borderRadius: 10,
    padding: 30,
    marginBottom: 20,
  },
  moneyTitleText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 28,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  moneyContentsContainer: {
    width: 300,
    height: 100,
    borderRadius: 10,
    flexDirection: 'row',
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  moneyAccountContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyText: {
    fontSize: 30,
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
    marginBottom: 5,
  },
  moneyAccountText: {
    fontSize: 12,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  iconContainer: {
    paddingBottom: 10,
  },
  payContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  payText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 12,
    marginTop: 3,
  },
  missionContainer: {
    width: 360,
    height: 96,
    borderRadius: 10,
    backgroundColor: colors.YELLOW_50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  missionText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 20,
  },
  quizContainer: {
    width: 360,
    height: 96,
    borderRadius: 10,
    backgroundColor: colors.YELLOW_50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  quizText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 20,
    margin: 2,
  },
  drawContainer: {
    width: '100%',
    height: 396,
  },
  machine: {
    position: 'relative',
    zIndex: 10,
    left: 32,
  },
  floor: {
    width: '100%',
    position: 'relative',
    top: -56,
  },
  goDraw: {
    width: 100,
    height: 140,
    position: 'relative',
    left: 260,
    top: -340,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawText: {
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    fontSize: 18,
    margin: 2,
  },
  gifImage: {
    width: 30,
    height: 30,
    marginBottom: 20,
  },
});

export default HomeScreen;
