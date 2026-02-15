import React, {useState, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {colors} from '@/constants/colors';
import {useFocusEffect} from '@react-navigation/native';
import {fonts} from '@/constants/font';
import useMissionStore from '@/stores/useMissionStore';
import useMission from '@/hooks/queries/useMission';
import axiosInstance from '@/api/axios';

interface Mission {
  missionId: number;
  contents: string;
  dueDate: string;
  reward: number;
}

const MissionCompleteChildScreen = () => {
  const childId = useMissionStore(state => state.getChildId());
  const [selectedMissionBox, setSelectedMissionBox] = useState<number | null>(
    null,
  );
  const {useGetMissions, useDeleteMission, useModifyMission} = useMission();
  const {mutate: deleteMission} = useDeleteMission();
  const {mutate: modifyMission} = useModifyMission();
  const {data: requireCompleteMission, refetch} = useGetMissions(
    childId || -1,
    'DONE',
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleMissionPress = (missionId: number) => {
    setSelectedMissionBox(missionId === selectedMissionBox ? null : missionId);
  };

  const formatDate = (dateStr: Date | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  };

  const handleMissionDelete = useCallback(
    async (missionId: number) => {
      try {
        const response = await axiosInstance.patch(`/mission/${missionId}`, {
          status: 'CREATED',
        });
        refetch();
      } catch (error) {
        console.log(error);
      }
    },
    [modifyMission],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.WHITE}}>
      <View style={styles.container}>
        {requireCompleteMission &&
        requireCompleteMission.missions.length < 1 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {' '}
              완료 요청 중인 미션이 없습니다
            </Text>
          </View>
        ) : (
          <ScrollView>
            {requireCompleteMission?.missions?.map(mission => (
              <TouchableOpacity
                key={mission.missionId}
                onPress={() => handleMissionPress(mission.missionId)}
                style={[
                  styles.boxContainer,
                  selectedMissionBox === mission.missionId &&
                    styles.boxContainerActive,
                ]}>
                {selectedMissionBox === mission.missionId ? (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleMissionDelete(mission.missionId)}>
                    <Text style={{fontFamily: fonts.MEDIUM, fontSize: 18}}>
                      완료 취소
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.cancelButton}>
                    <Text style={{fontFamily: fonts.MEDIUM, fontSize: 18}}>
                      대기중
                    </Text>
                  </View>
                )}

                <View style={{position: 'absolute', right: 25}}>
                  <Text
                    style={[
                      styles.largeText,
                      selectedMissionBox === mission.missionId && {
                        color: colors.GRAY_100,
                      },
                    ]}>
                    {mission.contents}
                  </Text>
                  <Text
                    style={[
                      styles.mediumText,
                      selectedMissionBox === mission.missionId && {
                        color: colors.GRAY_100,
                      },
                    ]}>
                    {mission.reward.toLocaleString()}원
                  </Text>
                  <Text
                    style={[
                      styles.smallText,
                      selectedMissionBox === mission.missionId && {
                        color: colors.GRAY_100,
                      },
                    ]}>
                    {formatDate(mission.dueDate)}까지
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {},
  loadingText: {},
  container: {
    margin: 20,
    alignItems: 'center',
  },
  boxContainer: {
    width: 350,
    height: 130,
    padding: 20,
    borderColor: colors.BLACK,
    backgroundColor: colors.YELLOW_50,
    borderRadius: 10,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    justifyContent: 'center',
    marginLeft: 25,
  },
  boxContainerActive: {
    backgroundColor: colors.YELLOW_25,
  },
  largeText: {
    fontSize: 20,
    marginBottom: 10,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
  mediumText: {
    fontSize: 15,
    marginBottom: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
  smallText: {
    fontSize: 15,
    marginBottom: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
});

export default MissionCompleteChildScreen;
