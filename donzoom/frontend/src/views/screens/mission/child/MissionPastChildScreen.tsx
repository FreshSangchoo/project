import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axiosInstance from '@/api/axios';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useMissionStore from '@/stores/useMissionStore';
import useMission from '@/hooks/queries/useMission';

const MissionPastChildScreen = () => {
  const childId = useMissionStore(state => state.getChildId());
  const {useGetMissions, useDeleteMission, useModifyMission} = useMission();
  const {data: missionPastData, refetch} = useGetMissions(
    childId || -1,
    'ACCEPTED',
  );
  const {mutate: deleteMission} = useDeleteMission();

  const [selectedMissionBox, setSelectedMissionBox] = useState<number | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleMissionPress = useCallback((missionId: number) => {
    setSelectedMissionBox(missionId === selectedMissionBox ? null : missionId);
  }, []);

  const handleMissionDelete = useCallback(
    async (missionId: number) => {
      try {
        deleteMission(missionId, {
          onSuccess: () => refetch(),
        });
      } catch (error) {
        console.log(error);
      }
    },
    [deleteMission, refetch],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.WHITE}}>
      <View style={styles.container}>
        {missionPastData && missionPastData?.missions?.length < 1 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}> 지난 미션이 없습니다.</Text>
          </View>
        ) : (
          <ScrollView>
            {missionPastData?.missions?.map(mission => (
              <View key={mission.missionId}>
                <TouchableOpacity
                  onPress={() => handleMissionPress(mission.missionId)}
                  style={[
                    styles.boxContainer,
                    selectedMissionBox === mission.missionId &&
                      styles.boxContainerActive,
                  ]}>
                  {selectedMissionBox === mission.missionId && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleMissionDelete(mission.missionId)}>
                      <Text style={{fontFamily: fonts.MEDIUM, fontSize: 18}}>
                        삭제
                      </Text>
                    </TouchableOpacity>
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
                      {mission.dueDate
                        .toLocaleString()
                        .slice(0, 10)
                        .replaceAll('-', '.')}
                      까지
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
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

export default MissionPastChildScreen;
