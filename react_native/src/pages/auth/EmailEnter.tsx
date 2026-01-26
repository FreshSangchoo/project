import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTextSection from '@/components/auth/AuthTextSection';
import TextField from '@/components/common/text-field/TextField';
import TextButton from '@/components/common/button/TextButton';
import EmojiGrinningface from '@/assets/icons/EmojiGrinningface.svg';
import EmojiIndexPointingUp from '@/assets/icons/EmojiIndexPointingUp.svg';
import { semanticNumber } from '@/styles/semantic-number';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import { useEmailStore } from '@/stores/authEmail';
import { useAuthSignupStore } from '@/stores/authSignupStore';
import EncryptedStorage from 'react-native-encrypted-storage';
import Modal from '@/components/common/modal/Modal';
import useCertificationNavigation from '@/hooks/navigation/useCertificationNavigation';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

const EmailEnter = () => {
  const navigation = useAuthNavigation();
  const rootNavigation = useRootNavigation();
  const emailValidate = useEmailStore(s => s.validate);
  const { setEmail } = useAuthSignupStore();
  const [emailView, setEmailView] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [verifyModal, setVerifyModal] = useState<boolean>(false);

  const onPress = () => {
    if (emailValidate(emailView)) {
      setIsEmailValid(true);
      EncryptedStorage.clear();
      setEmail(emailView);
      navigation.navigate('EmailCheck');
    } else setIsEmailValid(false);
  };

  return (
    <AuthLayout headerTitle="이메일로 계속하기" buttonText="다음" buttonDisabled={!emailView} onPress={onPress}>
      <AuthTextSection
        title="안녕하세요!"
        desc="계정이 있으면 로그인, 없으면 가입으로 이어져요."
        icon={<EmojiGrinningface />}
      />
      <View style={styles.textFieldSection}>
        <TextField
          label="이메일"
          placeholder="your@email.com"
          inputText={emailView}
          setInputText={setEmailView}
          validation={{
            isValid: emailView.length > 0 && !isEmailValid,
            validState: isEmailValid,
            validText: '올바른 이메일 형식으로 작성해 주세요.',
          }}
          returnKeyType="go"
          onSubmitEditing={onPress}
        />
        <TextButton onPress={() => setVerifyModal(true)} align="left">
          이메일이 기억나지 않아요
        </TextButton>
      </View>
      <Modal
        mainButtonText="본인인증 하러 가기"
        onClose={() => setVerifyModal(false)}
        onMainPress={() => {
          setVerifyModal(false);
          rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'foundEmail' } });
        }}
        titleText="본인인증이 필요해요"
        visible={verifyModal}
        buttonTheme="brand"
        descriptionText={`이전에 본인인증을 한 계정에 한하여\n이메일 찾기가 가능해요.`}
        titleIcon={<EmojiIndexPointingUp width={24} height={24} />}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    position: 'relative',
  },
  textFieldSection: {
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
  },
});

export default EmailEnter;
