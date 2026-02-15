import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import axiosInstance from '@/api/axios';
import KeyPad from '@/views/components/KeyPad';

export default function SafeAssetDetailScreen() {
  const [terminateModalVisible, setTerminateModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [safeAssetStatus, setSafeAssetStatus] = useState({
    exists: false,
    status: '',
    canTerminate: false,
  });
  const [calculatedMoney, setCalculatedMoney] = useState(0);
  const [monthlyDeposit, setMonthlyDeposit] = useState(0);
  const [interest, setInterest] = useState(0);
  const [availableCoin, setAvailableCoin] = useState(0);

  useEffect(() => {
    // 적금 상태 조회
    const fetchSavingsStatus = async () => {
      try {
        const response = await axiosInstance.get('/savings');
        if (response.status === 200) {
          setSafeAssetStatus(response.data);
          // 상태에 따라 추가 정보 호출
          if (response.data.exists) {
            if (response.data.status === '중도 해지 가능') {
              await fetchEarlyTerminationAmount();
            } else if (response.data.status === '만기 해지 가능') {
              await fetchMaturityAmount();
            }
          }
        }
      } catch (error) {
        console.error('Error fetching savings status:', error);
      }
    };

    // 현재 사용자가 보유한 코인 수량 조회
    const fetchAvailableCoin = async () => {
      try {
        const response = await axiosInstance.get('/coin');
        if (response.status === 200) {
          const coinAmount = response.data.coin;
          // 최대 코인이 5000보다 크면 5000으로 설정
          setAvailableCoin(coinAmount > 5000 ? 5000 : coinAmount);
        }
      } catch (error) {
        console.error('Error fetching available coin:', error);
      }
    };

    // 초기 적금 상태 및 코인 수량 가져오기
    fetchSavingsStatus();
    fetchAvailableCoin();
  }, []);

  const fetchEarlyTerminationAmount = async () => {
    try {
      const response = await axiosInstance.get('/savings/early');
      if (response.status === 200) {
        setCalculatedMoney(response.data.totalAmount);
        setInterest(response.data.interest);
      }
    } catch (error) {
      console.error('Error fetching early termination amount:', error);
    }
  };

  const fetchMaturityAmount = async () => {
    try {
      const response = await axiosInstance.get('/savings/full');
      if (response.status === 200) {
        setCalculatedMoney(response.data.totalAmount);
        setInterest(response.data.interest);
      }
    } catch (error) {
      console.error('Error fetching maturity amount:', error);
    }
  };

  const joinSavings = async () => {
    try {
      if (monthlyDeposit < 1000) {
        setAlertMessage('최소 가입 금액은 1000 머니 입니다');
        setAlertModalVisible(true);
        return;
      }

      const response = await axiosInstance.post(
        `/savings?monthlyDeposit=${monthlyDeposit}`,
      );

      if (response.status === 200) {
        setAlertMessage('적금 가입이 완료되었습니다.');
        setAlertModalVisible(true);
        setSafeAssetStatus({
          exists: true,
          status: '중도 해지 가능',
          canTerminate: true,
        });
      }
    } catch (error) {
      console.error('Error creating savings account:', error);
      setAlertMessage(`Error: 'Invalid request'`);
      setAlertModalVisible(true);
    }
  };

  const terminateSavings = async () => {
    try {
      const response = await axiosInstance.post('/savings/terminate');
      if (response.status === 200) {
        setCalculatedMoney(response.data.totalAmount);
        setSafeAssetStatus({exists: false, status: '', canTerminate: false});
        setAlertMessage(
          `적금 해지가 완료되었습니다. \n총 ${response.data.totalAmount} 머니가 반환되었습니다.`,
        );
        setAlertModalVisible(true);
      }
    } catch (error) {
      console.error('Error terminating savings account:', error);
      setAlertMessage(`Error: 'Invalid request'`);
      setAlertModalVisible(true);
    }
  };

  const updateValue = value => {
  if (value > availableCoin) {
      setMonthlyDeposit(availableCoin);
      setAlertText('');
    } else {
      setMonthlyDeposit(value);
      setAlertText('');
    }
  };

  const getTerminationMessage = () => {
    if (safeAssetStatus.status === '중도 해지 가능') {
      return `현재 해지시 중도 해지 이율 2% 적용되어 이자 ${interest.toLocaleString()}를 포함해 ${calculatedMoney.toLocaleString()} 머니 환급`;
    } else if (safeAssetStatus.status === '만기 해지 가능') {
      return `현재 해지시 만기 해지 이율 3.4% 적용되어 이자 ${interest.toLocaleString()}를 포함해 ${calculatedMoney.toLocaleString()} 머니 환급`;
    }
    return '';
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>현재 가입 가능한 적금 상품 목록</Text>
        </View>

        <View style={styles.savingsNameContainer}>
          <View style={styles.savingsPercentageContainer}>
            <Text style={styles.savingsNameText}>안전 제일 튼튼 적금</Text>
          </View>
          <View style={styles.savingsPercentageContainer}>
            <View
              style={[
                styles.savingsPercentageLeftContainer,
                styles.borderRight,
              ]}>
              <Text style={styles.savingsSubText}>최고</Text>
              <Text style={styles.savingsPercentageText}>연 3.5%</Text>
            </View>
            <View style={styles.savingsPercentageRightContainer}>
              <Text style={styles.savingsSubText}>기본</Text>
              <Text style={styles.savingsPercentageText}>연 3.4% (3개월)</Text>
            </View>
          </View>
        </View>

        <View style={styles.savingsDescriptionContainer}>
          <View style={styles.savingsDescriptionTextContainer}>
            {safeAssetStatus.exists ? (
              <Text style={styles.alertText}>※ 이미 가입된 상품입니다</Text>
            ) : (
              <Text style={styles.alertText}></Text>
            )}
            <Text style={styles.descriptionTitle}>상품안내</Text>
            <Text style={styles.descriptionSubTitle}>
              기간
              <Text style={styles.descriptionText}> 3개월</Text>
            </Text>
            <Text style={styles.descriptionSubTitle}>
              금액
              <Text style={styles.descriptionText}>
                {' '}
                월 1,000 머니 이상{'\n        '}5,000 머니 이하
              </Text>
            </Text>
            <Text style={styles.descriptionSubTitle}>
              가입방법
              <Text style={styles.descriptionText}> 모바일 앱</Text>
            </Text>
            <Text style={styles.descriptionSubTitle}>
              대상
              <Text style={styles.descriptionText}>
                {' '}
                실명의 개인(1인 1계좌)
              </Text>
            </Text>
            <Text style={styles.descriptionSubTitle}>
              적립방법
              <Text style={styles.descriptionText}>
                {' '}
                정액정립식(매달 1일 1회)
              </Text>
            </Text>
            <Text style={styles.descriptionSubTitle}>
              우대조건
              <Text style={styles.descriptionText}>
                {' '}
                기간 내 10회 이상 퀴즈 참여시{'\n                '}0.1% 우대
                이율 제공
              </Text>
            </Text>
            <Text style={styles.descriptionSubTitle}>
              이자지급
              <Text style={styles.descriptionText}> 만기일시 지급식</Text>
            </Text>
          </View>
          <View style={styles.savingsNoteTextContainer}>
            <Text style={styles.alertDescriptionText}>
              ※ 중도 해지 시 중도 해지 이율 2% 적용
            </Text>
            <Text style={styles.alertDescriptionText}>※ 일부 해지는 불가</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {safeAssetStatus.exists ? (
            <TouchableOpacity
              style={styles.terminateButton}
              onPress={() => setTerminateModalVisible(true)}>
              <Text style={styles.buttonText}>해지하기</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
            style={styles.okButton}
            onPress={() => {
              if (availableCoin < 1000) {
                // 머니가 1000보다 적으면 경고 메시지를 보여줌
                setAlertMessage('가입을 위해서는 최소 1000 머니 이상 필요합니다.');
                setAlertModalVisible(true);
              } else {
                // 머니가 충분하면 적금 가입 모달을 염
                setDepositModalVisible(true);
              }
            }}>
            <Text style={styles.buttonText}>가입하기</Text>
          </TouchableOpacity>
          
          )}

          {/* 적금 금액 입력 모달 */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={depositModalVisible}
            onRequestClose={() => setDepositModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.depositBox}>
                  <Text style={styles.modalTitleText}>가입 금액</Text>

                  {monthlyDeposit > 0 ? (
                    <Text
                      style={[styles.modalContentText, {color: colors.BLACK}]}>
                      {monthlyDeposit} 머니
                    </Text>
                  ) : (
                    <Text style={styles.modalContentText}>
                      매 월 얼마씩 넣을까요?
                    </Text>
                  )}

                  <Text style={styles.coinText}>
                    가입 가능 최소 2,000 | 최대 {availableCoin.toLocaleString()}{' '}
                    머니
                  </Text>
                </View>
                <KeyPad onInput={updateValue} currentValue={monthlyDeposit} />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setDepositModalVisible(false)}>
                    <Text style={styles.buttonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.realTerminateButton}
                    onPress={() => {
                      joinSavings();
                      setDepositModalVisible(false);
                    }}>
                    <Text style={styles.buttonText}>가입</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* 적금 해지 모달 */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={terminateModalVisible}
            onRequestClose={() => setTerminateModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.smallText}>{getTerminationMessage()}</Text>
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setTerminateModalVisible(false)}>
                    <Text style={styles.buttonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.realTerminateButton}
                    onPress={() => {
                      terminateSavings();
                      setTerminateModalVisible(false);
                    }}>
                    <Text style={styles.buttonText}>해지</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
        {/* 알림 모달 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={alertModalVisible}
          onRequestClose={() => setAlertModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.alertModalContent}>
              <Text style={styles.alertText}>{alertMessage}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setAlertModalVisible(false)}>
                <Text style={styles.buttonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  titleContainer: {
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  titleText: {
    marginTop: 8,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    fontSize: 20,
  },
  savingsNameContainer: {
    marginTop: 20,
    width: 310,
    height: 98,
    borderRadius: 10,
    backgroundColor: colors.YELLOW_25,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.YELLOW_100,
  },
  savingsDescriptionContainer: {
    marginTop: 20,
    height: 370,
    width: 310,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.YELLOW_100,
    backgroundColor: colors.WHITE,
  },
  savingsNameText: {
    textAlign: 'left',
    fontFamily: fonts.MEDIUM,
    fontSize: 18,
    color: colors.BLACK,
  },
  alertDescriptionText: {
    fontSize: 16,
    color: colors.BLACK,
    fontFamily: fonts.LIGHT,
  },
  savingsPercentageContainer: {
    flexDirection: 'row',
    marginTop: 3,
    marginLeft: 14,
  },
  savingsPercentageLeftContainer: {
    paddingRight: 10,
    marginTop: 7,
  },
  savingsPercentageRightContainer: {
    paddingLeft: 10,
    marginTop: 7,
  },
  borderRight: {
    borderRightWidth: 2,
    borderColor: colors.BLACK,
  },
  savingsSubText: {
    fontFamily: fonts.LIGHT,
    fontSize: 14,
    color: colors.BLACK,
  },
  savingsPercentageText: {
    fontFamily: fonts.BOLD,
    fontSize: 18,
    color: colors.BLUE_100,
  },
  descriptionTitle: {
    fontFamily: fonts.BOLD,
    fontSize: 20,
    color: colors.BLACK,
    lineHeight: 20,
    marginBottom: 10,
  },
  descriptionSubTitle: {
    fontFamily: fonts.BOLD,
    fontSize: 16,
    color: colors.BLACK,
    lineHeight: 20,
    margin: 3,
  },
  alertText: {
    margin: 10,
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
    color: colors.BLACK,
  },
  descriptionText: {
    fontFamily: fonts.LIGHT,
    color: colors.BLACK,
  },
  savingsDescriptionTextContainer: {
    marginLeft: 15,
  },
  savingsNoteTextContainer: {
    marginLeft: 15,
    marginTop: 15,
  },
  terminateButton: {
    width: 310,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.YELLOW_100,
    backgroundColor: colors.GRAY_25,
  },
  okButton: {
    width: 310,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.YELLOW_75,
  },
  cancelButton: {
    width: '35%',
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE37F',
  },
  realTerminateButton: {
    width: '35%',
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#FEE37F',
  },
  buttonText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    width: 320,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
  },
  noteText: {
    fontFamily: fonts.LIGHT,
    marginTop: 14,
    fontSize: 10,
    color: colors.BLACK,
  },
  input: {
    width: '100%',
    padding: 10,
    borderColor: colors.BLACK,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  keypadContainer: {
    backgroundColor: colors.WHITE,
    padding: 10,
    borderRadius: 10,
    marginVertical: 20,
  },
  modalContent: {
    width: 350,
    paddingVertical: 30,
    backgroundColor: colors.WHITE, // 모달 배경색 하얀색
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%', // 너비를 맞춤
    marginTop: 20,
  },
  depositBox: {
    backgroundColor: colors.YELLOW_25,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    // width:320,
  },
  //모달텍스트
  modalTitleText: {
    fontFamily: fonts.BOLD,
    fontWeight: '500',
    fontSize: 11,
    marginBottom: 10,
    color: colors.BLACK,
  },
  modalContentText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 23,
    marginBottom: 10,
  },
  coinText: {
    fontFamily: fonts.LIGHT,
    fontSize: 14,
    color: colors.BLACK,
    marginBottom: 10,
  },
  smallText: {
    fontFamily: fonts.LIGHT,
    fontSize: 14,
    color: colors.BLACK,
    textAlign: 'center',
    marginBottom: 10,
  },
  alertModalContent: {
    width: 300,
    padding: 20,
    backgroundColor: colors.WHITE,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: colors.YELLOW_75,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});
