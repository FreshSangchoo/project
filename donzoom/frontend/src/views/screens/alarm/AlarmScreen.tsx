import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import AlarmTabNavigator from '@/navigation/AlarmTabNavigator';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import useAlarm from '@/hooks/queries/useAlarm';
import {useEffect, useState} from 'react';

import Coin from '@/assets/coin.svg';

type Notification = {
  body: string;
  id: number;
  status: string | null;
  title: string;
  type: string | null;
};

export default function AlarmScreen() {
  const {getMyNotificationMutation} = useAlarm();
  const [alarmList, setAlarmList] = useState<Notification[]>([]);

  useEffect(() => {
    if (getMyNotificationMutation.data) {
      setAlarmList(getMyNotificationMutation.data);
    }
  }, [getMyNotificationMutation.data]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 알림 목록</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {alarmList && alarmList.length > 0 ? (
          alarmList.reverse().map(alarm => (
            <TouchableOpacity key={alarm.id} style={styles.alarmItem}>
              <Text style={styles.alarmTitle}>[{alarm.title}]</Text>
              <View style={styles.contentsContainer}>
                <Coin style={styles.coinImage} />
                <View style={styles.contentsText}>
                  <Text style={styles.alarmBody}>{alarm.body}</Text>
                  {/* <Text style={styles.alarmBody}>남은 내 코인</Text> */}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noAlarmText}>알림이 없습니다.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 20,
    backgroundColor: colors.WHITE,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.MEDIUM,
    marginBottom: 16,
    color: colors.BLACK,
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  alarmItem: {
    height: 84,
    paddingTop: 10,
    paddingLeft: 15,
    marginBottom: 10,
    backgroundColor: colors.YELLOW_50,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alarmTitle: {
    fontSize: 18,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    position: 'static',
    top: 5,
    left: 5,
  },
  contentsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: 5,
    position: 'static',
    top: 15,
  },
  coinImage: {
    marginRight: 10,
  },
  contentsText: {

  },
  alarmBody: {
    fontSize: 16,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    // marginBottom: 2,
  },
  noAlarmText: {
    fontSize: 16,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'center',
    marginTop: 20,
  },
});
