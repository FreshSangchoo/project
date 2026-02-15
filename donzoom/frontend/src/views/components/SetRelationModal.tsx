import {fonts} from '@/constants/font';
import {colors} from '@/constants/colors';
import {StyleSheet, Text, TouchableOpacity, View, Modal} from 'react-native';
import {useEffect, useState} from 'react';
import CustomButton from './CustomButton';
import InputField from './InputField';
import useAuth from '@/hooks/queries/useAuth';

interface EmailData {
  emailId: any;
  emailAddress: string;
}

const SetRelationModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: (emails: string[]) => void;
}) => {
  const [text, setText] = useState<string>('');
  const [emailData, setEmailData] = useState<EmailData[]>([]);

  const onChangeText = (input: string) => {
    setText(input);
  };

  // 이메일 형식 유효성 검사 (정규식)
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  // 이메일 추가 함수
  const handleUpdateEmail = (email: string) => {
    if (!isValidEmail(email)) {
      console.log('유효하지 않은 이메일입니다');
      return;
    }
    const emailExists = emailData.some(item => item.emailAddress === email);
    if (emailExists) {
      console.log('이미 존재하는 이메일입니다');
      return;
    }
    // 3. 유효성 검사를 통과한 경우 이메일 추가
    const newEmail = {
      emailId: Date.now(), // 고유한 id
      emailAddress: email,
    };
    const updatedEmails = [...emailData, newEmail];
    setEmailData(updatedEmails);
    setText(''); // 입력 필드를 초기화
  };

  const handleDelete = (id: number) => {
    const updatedEmails = emailData.filter(email => email.emailId !== id);
    setEmailData(updatedEmails);
  };

  const sendEmail = () => {
    // emailAddress만 있는 string[]로 변환
    const emailAddresses = emailData.map(email => email.emailAddress);
    // 이메일 전송 후 부모 컴포넌트에 string[] 전달
    onClose(emailAddresses);
  };

  return (
    <Modal transparent={true} visible={visible} onRequestClose={sendEmail}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* 텍스트 박스 */}
          <View style={{marginTop: 50, marginBottom: 20}}>
            <Text
              style={{
                textAlign: 'center',
                fontFamily: fonts.MEDIUM,
                fontSize: 20,
                color: colors.BLACK,
              }}>
              아이 정보를 추가해주세요
            </Text>
            <Text
              style={{
                marginVertical: 5,
                fontFamily: fonts.LIGHT,
                fontSize: 12,
                color: colors.BLACK,
              }}></Text>
          </View>
          <View
            style={{
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <InputField
              style={styles.input}
              inputMode="text"
              placeholder="아이 이메일"
              onChangeText={onChangeText}
              value={text}
            />
            <TouchableOpacity
              style={{alignItems: 'center'}}
              onPress={() => handleUpdateEmail(text)}>
              <Text style={[styles.textButton, {color: colors.BLUE_100}]}>
                추가
              </Text>
            </TouchableOpacity>
          </View>
          {emailData.map(email => (
            <View key={email.emailId} style={styles.emailContainer}>
              <View style={styles.emailBox}>
                <Text style={styles.emailText}> {email.emailAddress} </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(email.emailId)}>
                <Text style={styles.textButton}>삭제</Text>
              </TouchableOpacity>
            </View>
          ))}
          <CustomButton
            style={{marginTop: 50, marginBottom: 25}}
            label="확인"
            Role="부모"
            onPress={sendEmail}
          />
        </View>
      </View>
    </Modal>
  );
};

export default SetRelationModal;

const styles = StyleSheet.create({
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
    fontSize: 12,
    color: colors.BLACK,
    marginLeft: 10,
  },
});
