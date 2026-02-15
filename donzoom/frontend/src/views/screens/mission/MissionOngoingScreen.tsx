import React, {useState, useCallback, useMemo} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import axiosInstance from '@/api/axios';
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MissionBox from '../../components/MissionBox';
import {colors} from '@/constants/colors';
import InputField from '@/views/components/InputField';
import CustomCalendar from '@/views/components/CustomCalendar';
import KeyPad from '@/views/components/KeyPad';
import {fonts} from '@/constants/font';
import useMission from '@/hooks/queries/useMission';
import useMissionStore from '@/stores/useMissionStore';

const MissionOngoingScreen = () => {
  const childId = useMissionStore(state => state.getChildId());
  const [selectedMissionBox, setSelectedMissionBox] = useState<number | null>(
    null,
  );
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showKeyPad, setShowKeyPad] = useState(false);

  // 미션 수정 관련 상태
  const [modifyState, setModifyState] = useState({
    missionId: -1,
    title: '',
    pay: -1,
    date: '',
    textCount: 0,
  });

  const formatDate = useCallback((dateStr: Date | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  }, []);

  const {useGetMissions, useDeleteMission, useModifyMission} = useMission();
  const {
    data: missionData,
    refetch,
    isLoading: isFetching,
  } = useGetMissions(childId || -1, 'CREATED');
  const {mutate: deleteMission, isLoading: isDeleting} = useDeleteMission();
  const {mutate: modifyMission, isLoading: isModifying} = useModifyMission();

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleMissionPress = useCallback((missionId: number) => {
    setSelectedMissionBox(prev => (missionId === prev ? null : missionId));
  }, []);

  const handleButtonModify = useCallback(
    (missionId: number) => {
      const mission = missionData?.missions?.find(
        m => m.missionId === missionId,
      );
      if (mission) {
        setModifyState({
          missionId,
          title: mission.contents ?? '',
          pay: mission.reward ?? 0,
          date: formatDate(mission.dueDate),
          textCount: mission.contents?.length ?? 0,
        });
        setShowModifyModal(true);
      }
    },
    [missionData, formatDate],
  );

  const handleButtonDelete = useCallback(
    (missionId: number) => {
      deleteMission(missionId, {
        onSuccess: () => {
          console.log('미션삭제');
          refetch();
        },
        onError: error => {
          console.log(error);
        },
      });
    },
    [deleteMission, refetch],
  );

  const onChangeText = useCallback((input: string) => {
    if (input.length <= 20) {
      setModifyState(prev => ({
        ...prev,
        title: input,
        textCount: input.length,
      }));
    }
  }, []);

  const toggleCalendar = useCallback(() => {
    setShowKeyPad(false);
    setShowCalendar(prev => !prev);
  }, []);

  const toggleKeypad = useCallback(() => {
    setShowCalendar(false);
    setShowKeyPad(prev => !prev);
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setModifyState(prev => ({
      ...prev,
      date,
    }));
  }, []);

  const updateMissionPay = useCallback((newValue: number) => {
    setModifyState(prev => ({
      ...prev,
      pay: Math.min(Math.max(newValue, 0), 100000),
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      const {missionId, title, pay, date} = modifyState;
      const response = await axiosInstance.patch(`/mission/${missionId}`, {
        contents: title,
        dueDate: date,
        reward: pay,
      });

      if (response.status === 200) {
        setShowModifyModal(false);
        refetch();
      }
    } catch (error) {
      console.log(error);
    }
  }, [modifyState, refetch]);

  const MissionList = useMemo(() => {
    if (!missionData?.missions?.length) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>진행 중인 미션이 없습니다.</Text>
        </View>
      );
    }

    return (
      <ScrollView>
        {missionData.missions.map(mission => (
          <MissionBox
            key={mission.missionId}
            missionTitle={mission.contents}
            missionPay={mission.reward}
            missionDate={formatDate(mission.dueDate)}
            onPress={() => handleMissionPress(mission.missionId)}
            isSelected={selectedMissionBox === mission.missionId}
            buttonOne="미션수정"
            buttonTwo="미션취소"
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
    formatDate,
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

        <Modal visible={showModifyModal} transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <InputField
                style={{
                  color: colors.GRAY_100,
                  fontSize: 15,
                  fontFamily: fonts.MEDIUM,
                  marginTop: 23,
                  padding: 0,
                }}
                onChangeText={onChangeText}
                value={modifyState.title}
                autoFocus={!showCalendar && !showKeyPad}
              />

              <TouchableOpacity onPress={toggleKeypad}>
                <Text style={styles.payText}>{modifyState.pay} 원</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleCalendar}>
                <Text style={{color: colors.GRAY_100}}>
                  <Text
                    style={{
                      fontSize: 15,
                      color: colors.BLUE_100,
                      fontFamily: fonts.MEDIUM,
                    }}>
                    {modifyState.date}
                  </Text>
                  까지 미션을 완료해주세요!
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: fonts.MEDIUM,
                  textAlign: 'center',
                  color: colors.BLACK,
                }}>
                수정 완료하기
              </Text>
            </TouchableOpacity>

            {showCalendar && (
              <View style={{position: 'absolute', top: 470}}>
                <CustomCalendar
                  selectedDate={modifyState.date}
                  onDateSelect={handleDateSelect}
                />
              </View>
            )}

            {showKeyPad && (
              <View
                style={{
                  position: 'absolute',
                  top: 470,
                  width: '100%',
                  alignItems: 'center',
                  backgroundColor: colors.YELLOW_25,
                }}>
                <KeyPad
                  onInput={updateMissionPay}
                  currentValue={modifyState.pay}
                />
              </View>
            )}
          </View>
        </Modal>
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
    margin: 20,
    alignItems: 'center',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  modalContainer: {
    marginTop: 230,
    width: 330,
    height: 150,
    backgroundColor: colors.YELLOW_50,
    borderRadius: 10,
    alignItems: 'center',
  },
  payText: {
    fontSize: 24,
    fontFamily: fonts.BOLD,
    fontWeight: '700',
    color: colors.BLUE_100,
    marginTop: 8,
    marginBottom: 15,
  },
  confirmButton: {
    marginTop: 10,
    width: 300,
    height: 50,
    paddingVertical: 10,
    backgroundColor: colors.WHITE,
    borderRadius: 10,
  },
});

export default React.memo(MissionOngoingScreen);
