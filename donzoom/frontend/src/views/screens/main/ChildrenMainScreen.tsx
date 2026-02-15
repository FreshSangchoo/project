import {fonts} from '@/constants/font';
import {colors} from '@/constants/colors';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import Icon from 'react-native-vector-icons/Octicons';
import SettingIcon from 'react-native-vector-icons/Ionicons';
import NextIcon from 'react-native-vector-icons/MaterialIcons';

import PayIcon from '@/assets/pay.svg';
import DrawMachine from '@/assets/voidDrawMachine.svg';
import Floor from '@/assets/longFloor.svg';
import GifImage from 'react-native-gif';
import Profile from '@/views/components/HomeProfile';
import {useEffect} from 'react';
import useAccountBalance from '@/hooks/useAccountInfo';
import {useSignupStore} from '@/stores/useAuthStore';
import useAuth from '@/hooks/queries/useAuth';
import useFCMStore from '@/stores/useFCMStore';
import React from 'react';

function ChildrenMainScreen() {
  const navigation = useNavigation() as any;
  const {account, balance, error, refetch} = useAccountBalance();
  const {name, setName} = useSignupStore();
  const {getProfileQuery} = useAuth();

  useEffect(() => {
    refetch();
    setName(getProfileQuery.data ? getProfileQuery.data.name : '');
  }, []);

  const refresh = () => {
    refetch();
  };

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, []),
  );

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.contentsContainer}>
          <View style={styles.profileContainer}>
            <Profile name={name} />
          </View>
          <View style={styles.mypageContainer}>
            <TouchableOpacity
              style={styles.mypageAlarm}
              onPress={() => navigation.navigate('알림')}>
              <Icon name="bell-fill" size={16} style={styles.icon} />
              <Text style={styles.mypageText}>알림</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mypageSetting}
              onPress={() => navigation.navigate('설정')}>
              <SettingIcon name="settings" size={16} style={styles.icon} />
              <Text style={styles.mypageText}>설정</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.moneyContainer}>
            {account !== '' ? (
              <View>
                <Text style={styles.moneyTitleText}>
                  이번달 남은 <Text style={{fontFamily: fonts.BOLD}}>용돈</Text>
                  은
                </Text>
                <View style={styles.moneyContentsContainer}>
                  <View style={styles.moneyAccountContainer}>
                    <Text
                      style={styles.moneyText}
                      adjustsFontSizeToFit={true}
                      numberOfLines={1}>{`${parseInt(
                      balance,
                    ).toLocaleString()}원`}</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('계좌관리')}>
                      <Text style={styles.accountText}>내 계좌 관리하기</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.iconContainer}>
                    <NextIcon
                      name="navigate-next"
                      size={40}
                      color={colors.BLACK}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('QRCodeScanner')}>
                    <View style={styles.payContainer}>
                      <PayIcon width={50} height={50} />
                      <Text style={styles.payText}>결제</Text>
                    </View>
                  </TouchableOpacity>
                  {/* <TouchableOpacity onPress={refresh}>
                    <Text>새로고침</Text>
                  </TouchableOpacity> */}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('계좌개설')}
                style={styles.initAccountButton}>
                <Text style={styles.moneyAccountText2}>
                  아직 계좌가 없으시네요!
                </Text>
                <Text style={styles.moneyAccountText}>계좌 개설하기</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.missionContainer}
            onPress={() =>
              navigation.navigate('아이미션', {
                screen: '아이미션',
                params: {profile: getProfileQuery.data},
              })
            }>
            <Text style={styles.missionText}>
              오늘의 <Text style={{fontFamily: fonts.BOLD}}>미션</Text> 수행하러
              가기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quizContainer}
            onPress={() => navigation.navigate('퀴즈')}>
            <Text style={styles.quizText}>금융 상식 UP! 머니 GET!</Text>
            <Text style={styles.quizText}>
              오늘의 <Text style={{fontFamily: fonts.BOLD}}>퀴즈</Text>는?
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.drawContainer}>
          <DrawMachine style={styles.machine} />
          <Floor style={styles.floor} />
          <TouchableOpacity
            style={styles.goDraw}
            onPress={() => navigation.navigate('픽뽑기')}>
            <GifImage
              source={require('@/assets/coin.gif')}
              style={styles.gifImage}
              resizeMode="contain"
            />
            <Text style={styles.drawText}>머니로</Text>
            <Text style={styles.drawText}>뽑기하러</Text>
            <Text style={styles.drawText}>가기</Text>
            <Text style={styles.drawText}>{'>>>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentsContainer: {
    padding: 20,
  },
  profileContainer: {},
  mypageContainer: {
    width: 340,
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
    width: 340,
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
    marginBottom: 15,
  },
  moneyAccountText: {
    fontSize: 30,
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
  },
  accountText: {
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
    width: 340,
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
    width: 340,
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
  initAccountButton: {
    backgroundColor: colors.WHITE,
    padding: 10,
    borderRadius: 5,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyAccountText2: {
    fontSize: 20,
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
  },
});

export default ChildrenMainScreen;
