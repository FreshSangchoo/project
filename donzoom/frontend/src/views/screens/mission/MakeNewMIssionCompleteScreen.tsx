import React, {useCallback, useState} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {colors} from '@/constants/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '@/api/axios';
import {fonts} from '@/constants/font';
import useMissionStore from '@/stores/useMissionStore';
import useMission from '@/hooks/queries/useMission';

const MakeNewMissionCompleteScreen = ({navigation, route}: any) => {
  const {text, selectedDate, pay} = route.params;
  const {usePostMission} = useMission();
  const childId = useMissionStore(state => state.getChildId());
  const {mutate: postMission} = usePostMission();
  const [alertText, setAlertText] = useState('');

  const sendMissionInfo = (text: string, pay: number, selectedDate: string) => {
    if (!childId) {
      setAlertText('아이 정보가 없어 미션을 생성할 수 없습니다.');
      return;
    }
    postMission({
      childId: childId,
      contents: text,
      dueDate: selectedDate,
      reward: pay,
    });
  };

  const formatDate = (dateStr: Date | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  };
  return (
    <SafeAreaView style={styles.container}>
      <Icon name="clipboard-text-outline" size={135} />
      <Text
        style={{
          margin: 12,
          fontFamily: fonts.MEDIUM,
          fontSize: 25,
          fontWeight: '500',
          color: colors.BLACK,
        }}>
        미션 생성 완료
      </Text>
      <View style={styles.missionbox}>
        <Text style={styles.largeText}>{text}</Text>
        <Text style={styles.mediumText}>{pay.toLocaleString()} 원</Text>
        <Text style={styles.smallText}>
          <Text style={{color: colors.BLUE_100}}>
            {formatDate(selectedDate)}
          </Text>{' '}
          까지 미션을 완료해주세요!
        </Text>
      </View>
      <Text style={{marginTop: 200, color: colors.RED_100}}>{alertText}</Text>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => {
          console.log('Button pressed');
          sendMissionInfo(text, pay, selectedDate);
          setTimeout(() => {
            navigation.navigate('부모미션',{
              screen:"진행중"
            });
          }, 200);
        }}>
        <Text
          style={{
            color: colors.BLACK,
            fontSize: 18,
            fontFamily: fonts.MEDIUM,
            fontWeight: '500',
            textAlign: 'center',
            padding: 10,
          }}>
          확인
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.YELLOW_25,
    alignItems: 'center',
    paddingTop: 100,
  },
  missionbox: {
    marginTop: 15,
    width: 330,
    height: 150,
    backgroundColor: colors.WHITE,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 20,
    justifyContent: 'space-evenly',
  },
  payText: {
    fontSize: 24,
    fontFamily: fonts.BOLD,
    fontWeight: '700',
    color: colors.BLUE_100,
  },
  missionText: {
    fontSize: 15,
    fontFamily: fonts.BOLD,
    color: colors.GRAY_100,
    fontWeight: '500',
  },
  largeText: {
    fontSize: 25,
    marginBottom: 10,
    fontFamily: fonts.MEDIUM,
    color: colors.BLUE_100,
    textAlign: 'right',
  },
  mediumText: {
    fontSize: 20,
    marginBottom: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLUE_100,
    textAlign: 'right',
  },
  smallText: {
    fontSize: 15,
    marginBottom: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 40,
    width: 300,
    height: 50,
    backgroundColor: colors.WHITE,
    borderRadius: 10,
  },
});

export default MakeNewMissionCompleteScreen;
