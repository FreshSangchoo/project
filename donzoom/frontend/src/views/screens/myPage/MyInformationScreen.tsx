import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useAuth from '@/hooks/queries/useAuth';
import useSignupForm from '@/hooks/useSignupForm';
import {useSignupStore} from '@/stores/useAuthStore';
import useLogout from '@/stores/useLogout';
import useMissionStore from '@/stores/useMissionStore';
import usePasswordStore from '@/stores/usePasswordStore';
import CustomButton from '@/views/components/CustomButton';
import InputField from '@/views/components/InputField';
import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import NextIcon from 'react-native-vector-icons/MaterialIcons';
import SetRelationModal from '@/views/components/SetRelationModal';
import {useChildrenStore} from '@/stores/useChildrenStore';

interface emailData {
  emailId: any;
  emailAddress: string;
}

function MyInformationScreen() {
  const getChildren = useMissionStore(state => state.getChildren());
  const navigation = useNavigation() as any;
  const logout = useLogout();
  const {logoutMutation, childAddMutation} = useAuth();
  const {reset: signupReset} = useSignupForm();
  const {reset: passwordReset} = usePasswordStore();
  const {isParent} = useSignupStore();
  const {myChildren, setSelectedChild: setCurrentChild} = useChildrenStore();

  const [modalVisible, setModalVisible] = useState(false);

  // 모달 닫기->아이 정보 추가
  const handleModalClose = (emails: string[]) => {
    setModalVisible(false);
    if (emails.length === 0) {
      return;
    }
    childAddMutation.mutate(emails, {
      onSuccess: () => {
        console.log('아이 이메일 전송 성공');
      },
    });
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        {isParent && (
          <>
            {/* <View style={styles.menuContainer}>
              <View style={styles.inquireAutoTransferHeaderContainer}>
                <Text style={styles.cardTitle}>자동 이체 등록</Text>
                <Text style={styles.cardSubtitle}>
                  등록된 계좌로 우리 아이들 용돈이 자동이체 됩니다.
                </Text>
              </View>
              <View style={styles.autoTransferAccountInfoContainer}>
                <Text style={styles.autoTransferInnerText}>
                  현재 등록된 계좌가 없습니다.
                </Text>
                <Text style={styles.autoTransferInnerText}>
                  (최대 2개 등록 가능)
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.inquireAutoTransferTextContainer,
                  ,
                  {marginBottom: 10},
                ]}>
                <Text style={[styles.inquireAccountText]}>계좌 등록하기</Text>
                <NextIcon name="navigate-next" size={20} color={colors.BLACK} />
              </TouchableOpacity>
            </View> */}

            {isParent ? (
              <View style={styles.menuContainer}>
                <View style={styles.childInfoHeaderContainer}>
                  <Text style={styles.cardTitle}>등록된 아이 정보</Text>
                </View>

                {myChildren.length > 0 ? (
                  <>
                    {myChildren.map((child, index) => (
                      <View key={child.id} style={styles.childInfoContainer}>
                        <View style={styles.childInfoDetailContainer}>
                          <Image
                            source={{
                              uri: child.profileImage
                                ? child.profileImage
                                : 'http://j11a108.p.ssafy.io:8081/api/uploads/676e51cb-fcd0-41fc-a07c-f8fea8e99f4f.png',
                            }}
                            style={styles.image}
                          />
                          <Text style={styles.childInfoText}>
                            {child.name}({child.nickname})
                          </Text>
                        </View>
                        <View style={styles.childInfoManageContainer}>
                          <TouchableOpacity>
                            <Text style={styles.manageText}>관리</Text>
                          </TouchableOpacity>
                          <TouchableOpacity>
                            <Text style={styles.deleteText}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.securityMenuContainer}
                      onPress={() => setModalVisible(true)}>
                      <Text style={styles.securityMenuText}>
                        아이 정보 추가
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View>
                    <View style={[styles.securityMenuContainer]}>
                      <Text style={styles.securityMenuText}>
                        아직 등록된 아이가 없습니다
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.securityMenuContainer}
                      onPress={() => setModalVisible(true)}>
                      <Text style={styles.securityMenuText}>
                        아이 정보 추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}
          </>
        )}
        <View style={styles.alarmMenuContainer}>
          <View style={styles.securityHeaderContainer}>
            <Text style={styles.cardTitle}>QR코드 생성</Text>
          </View>
          <TouchableOpacity
            style={styles.securityMenuContainer}
            onPress={() => navigation.navigate('QR 생성')}>
            <Text style={styles.securityMenuText}>QR 생성</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.alarmMenuContainer}>
          <View style={styles.securityHeaderContainer}>
            <Text style={styles.cardTitle}>인증/보안</Text>
          </View>
          <TouchableOpacity
            style={styles.securityMenuContainer}
            onPress={() => navigation.navigate('보안 설정')}>
            <Text style={styles.securityMenuText}>보안 설정</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.alarmMenuContainer}>
          <View style={styles.securityHeaderContainer}>
            <Text style={styles.cardTitle}>알림 설정</Text>
          </View>
          <TouchableOpacity
            style={styles.alarmMenuTextContainer}
            onPress={() => navigation.navigate('알림 설정')}>
            <Text style={styles.alarmMenuText}>알림 설정</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.alarmMenuContainer}>
          <View style={styles.securityHeaderContainer}>
            <Text style={styles.cardTitle}>로그아웃</Text>
          </View>
          <TouchableOpacity
            style={styles.alarmMenuTextContainer}
            onPress={() => {
              logoutMutation.mutate(null);
              signupReset();
              passwordReset();
            }}>
            <Text style={styles.alarmMenuText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
        {/* <View style={styles.alarmMenuContainer}>
          <View style={styles.securityHeaderContainer}>
            <Text style={styles.cardTitle}>결제한도 설정</Text>
          </View>
          <TouchableOpacity
            style={styles.alarmMenuTextContainer}
            onPress={() => {}}>
            <Text style={styles.alarmMenuText}>결제한도 설정</Text>
          </TouchableOpacity>
        </View> */}
      </View>
      {/* 아이 정보 추가 모달 */}
      <SetRelationModal visible={modalVisible} onClose={handleModalClose} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  menuContainer: {
    backgroundColor: colors.YELLOW_50,
    width: 360,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  alarmMenuContainer: {
    backgroundColor: colors.YELLOW_50,
    width: 360,
    height: 140,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    fontSize: 20,
    marginTop: 20,
  },
  cardSubtitle: {
    color: colors.GRAY_75,
    marginTop: 6,
    fontFamily: fonts.MEDIUM,
    fontSize: 12,
  },
  inquireAutoTransferHeaderContainer: {
    width: 312,
    marginBottom: 16,
  },
  autoTransferAccountInfoContainer: {
    width: 320,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.WHITE,
    marginBottom: 10,
  },
  autoTransferInnerText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 14,
  },
  inquireAutoTransferTextContainer: {
    width: 340,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inquireAccountText: {
    color: colors.BLACK,
    marginLeft: 'auto',
    fontFamily: fonts.MEDIUM,
    fontSize: 14,
  },
  childInfoHeaderContainer: {
    width: 312,
    marginBottom: 16,
  },
  childInfoContainer: {
    flexDirection: 'row',
    position: 'relative',
    width: 320,
    height: 120,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  childInfoDetailContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: colors.BLACK,
    borderRadius: 50,
    marginTop: 6,
    marginBottom: 8,
  },
  childInfoText: {
    fontSize: 16,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
  },
  childInfoManageContainer: {
    left: 238,
    top: 14,
    flexDirection: 'row',
    position: 'absolute',
  },
  manageText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLUE_100,
    fontSize: 16,
  },
  deleteText: {
    fontFamily: fonts.MEDIUM,
    marginLeft: 6,
    color: colors.RED_100,
    fontSize: 16,
  },
  securityHeaderContainer: {
    width: 312,
    marginBottom: 20,
  },
  securityMenuContainer: {
    width: 320,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    marginBottom: 12,
  },
  securityMenuText: {
    fontSize: 16,
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
  },
  alarmMenuTextContainer: {
    width: 320,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    marginBottom: 10,
  },
  alarmMenuText: {
    fontSize: 16,
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
  },
  input: {
    fontFamily: fonts.LIGHT,
    fontSize: 14,
    borderBottomColor: colors.GRAY_50,
    borderBottomWidth: 1,
    width: 215,
  },
  modalOverlay: {
    flex: 1,
    paddingTop: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  modalContainer: {
    width: 350,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '68%',
    marginTop: 10,
  },
  emailBox: {
    flex: 1,
    backgroundColor: colors.GRAY_25,
    borderRadius: 5,
    marginRight: 10,
    paddingVertical: 5,
    paddingLeft: 5,
  },
  emailText: {
    fontSize: 12,
    fontFamily: fonts.LIGHT,
    color: colors.BLACK,
    textAlign: 'left',
  },
  textButton: {
    fontFamily: fonts.LIGHT,
    fontSize: 10,
    color: colors.BLACK,
  },
});

export default MyInformationScreen;
