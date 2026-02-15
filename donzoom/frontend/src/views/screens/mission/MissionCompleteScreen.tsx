import React, {useState, useCallback, useMemo} from 'react';
import axiosInstance from '@/api/axios';
import MissionBox from '../../components/MissionBox';
import {useFocusEffect} from '@react-navigation/native';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {colors} from '@/constants/colors';
import useMission from '@/hooks/queries/useMission';
import useMissionStore from '@/stores/useMissionStore';

interface Mission {
  missionId: number;
  contents: string;
  dueDate: string;
  reward: number;
}

const MissionCompleteScreen = ({route}: any) => {
  const childId = useMissionStore(state => state.getChildId());
  const [selectedMissionBox, setSelectedMissionBox] = useState<number | null>(
    null,
  );

  const {useGetMissions, useDeleteMission, useModifyMission} = useMission();
  const {
    data: requireCompleteMission,
    refetch,
    isLoading: isFetching,
  } = useGetMissions(childId || -1, 'DONE');

  const {mutate: deleteMission, isLoading: isDeleting} = useDeleteMission();
  const {mutate: modifyMission, isLoading: isModifying} = useModifyMission();

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const formatDate = useCallback((dateStr: Date | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  }, []);

  const handleMissionPress = useCallback((missionId: number) => {
    setSelectedMissionBox(prev => (missionId === prev ? null : missionId));
  }, []);

  const handleButtonConfirm = useCallback(
    async (missionId: number) => {
      try {
        const response = await axiosInstance.patch(`/mission/${missionId}`, {
          status: 'ACCEPTED',
        });
        if (response.status === 200) {
          refetch();
        }
      } catch (error) {
        console.log('미션 완료 에러', error);
      }
    },
    [refetch],
  );

  const handleButtonDelete = useCallback(
    async (missionId: number) => {
      try {
        modifyMission(
          {
            missionId,
            status: 'CREATED',
          },
          {
            onSuccess: () => {
              refetch();
            },
            onError: error => {
              console.log(error);
            },
          },
        );
      } catch (error) {
        console.log(error);
      }
    },
    [modifyMission, refetch],
  );

  const MissionList = useMemo(() => {
    if (!requireCompleteMission?.missions?.length) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>완료 요청한 미션이 없습니다.</Text>
        </View>
      );
    }

    return (
      <ScrollView>
        {requireCompleteMission.missions.map(mission => (
          <MissionBox
            key={mission.missionId}
            missionTitle={mission.contents}
            missionPay={mission.reward}
            missionDate={formatDate(mission.dueDate)}
            onPress={() => handleMissionPress(mission.missionId)}
            isSelected={selectedMissionBox === mission.missionId}
            buttonOne="승인"
            buttonTwo="거절"
            onPressButtonOne={() => handleButtonConfirm(mission.missionId)}
            onPressButtonTwo={() => handleButtonDelete(mission.missionId)}
          />
        ))}
      </ScrollView>
    );
  }, [
    requireCompleteMission,
    selectedMissionBox,
    formatDate,
    handleMissionPress,
    handleButtonConfirm,
    handleButtonDelete,
  ]);

  const isLoading = isFetching || isDeleting || isModifying;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.WHITE}}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.BLUE_100} />
        ) : (
          MissionList
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.GRAY_50,
  },
  container: {
    flex: 1,
    margin: 20,
    alignItems: 'center',
  },
});

export default React.memo(MissionCompleteScreen);
