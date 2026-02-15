import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  SafeAreaView,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MissionBox from '@/views/components/MissionBox';
import {StyleSheet} from 'react-native';
import {colors} from '@/constants/colors';
import useMissionStore from '@/stores/useMissionStore';
import useMission from '@/hooks/queries/useMission';
import axiosInstance from '@/api/axios';

interface Mission {
  missionId: number;
  contents: string;
  dueDate: string;
  reward: number;
}

const MissionOngoingChildScreen = () => {
  const childId = useMissionStore(state => state.getChildId());
  const [selectedMissionBox, setSelectedMissionBox] = useState<number | null>(
    null,
  );

  const formatDate = (dateStr: Date | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  };

  const {useGetMissions, useDeleteMission, useModifyMission} = useMission();
  const {
    data: missionData,
    refetch,
    isLoading: isFetching,
  } = useGetMissions(childId || -1, 'CREATED');

  const {mutate: deleteMission, isLoading: isDeleting} = useDeleteMission();
  const {mutate: modifyMission, isLoading: isModifying} = useModifyMission();

  // 화면이 포커스될 때만 데이터를 새로 불러옴
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  const handleMissionPress = useCallback((missionId: number) => {
    setSelectedMissionBox(prevId => (missionId === prevId ? null : missionId));
  }, []);

  const handleButtonModify = useCallback(
    async (missionId: number) => {
      try {
        const response = await axiosInstance.patch(`/mission/${missionId}`, {
          status: 'DONE',
        });
        if (response.status === 200) {
          refetch();
        }
      } catch (error) {
        console.log(error);
        // 에러 처리 로직 추가
      }
    },
    [refetch],
  );

  const handleButtonDelete = useCallback(
    (missionId: number) => {
      deleteMission(missionId, {
        onSuccess: () => {
          // 삭제 성공 시에만 refetch 실행
          refetch();
        },
        onError: error => {
          refetch();
          console.log(error);
          // 에러 처리 로직 추가
        },
      });
    },
    [deleteMission, refetch],
  );

  // 전체 로딩 상태 통합 관리
  const isLoading = isFetching || isDeleting || isModifying;

  const MissionList = useCallback(() => {
    if (missionData?.missions?.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>진행 중인 미션이 없습니다</Text>
        </View>
      );
    }

    return (
      <ScrollView>
        {missionData?.missions?.map(mission => (
          <MissionBox
            key={mission.missionId}
            missionTitle={mission.contents}
            missionPay={mission.reward}
            missionDate={formatDate(mission.dueDate)}
            onPress={() => handleMissionPress(mission.missionId)}
            isSelected={selectedMissionBox === mission.missionId}
            buttonOne="완료"
            buttonTwo="중단"
            onPressButtonOne={() => handleButtonModify(mission.missionId)}
            onPressButtonTwo={() => handleButtonDelete(mission.missionId)}
          />
        ))}
      </ScrollView>
    );
  }, [
    missionData,
    selectedMissionBox,
    handleMissionPress,
    handleButtonModify,
    handleButtonDelete,
  ]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.WHITE}}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.BLUE_100} />
          </View>
        ) : (
          <MissionList />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.GRAY_50,
  },
  container: {
    flex: 1,
    margin: 20,
  },
});

export default React.memo(MissionOngoingChildScreen);
