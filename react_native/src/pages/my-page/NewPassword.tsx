import { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import AuthTextSection from '@/components/auth/AuthTextSection';
import TextField from '@/components/common/text-field/TextField';
import { semanticNumber } from '@/styles/semantic-number';
import useMyNavigation, { MyStackParamList } from '@/hooks/navigation/useMyNavigation';
import CenterHeader from '@/components/common/header/CenterHeader';
import { semanticColor } from '@/styles/semantic-color';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ToolBar from '@/components/common/button/ToolBar';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useToastStore } from '@/stores/toastStore';

type NewPasswordRoute = RouteProp<MyStackParamList, 'NewPassword'>;

const isAndroid = Platform.OS === 'android';

function NewPassword() {
  const navigation = useMyNavigation();
  const route = useRoute<NewPasswordRoute>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isSamePassword, setIsSamePassword] = useState(true);
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,32}$/;
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const [sticky, setSticky] = useState(false);
  const showToast = useToastStore(s => s.show);

  const { postChangePassword } = useAuthApi();

  const onPress = async () => {
    if (password !== confirmPassword) {
      setIsSamePassword(false);
      showToast({ message: '비밀번호가 맞지 않아요.', image: 'EmojiRedExclamationMark', duration: 1000 });
      return;
    }

    setIsSamePassword(true);

    try {
      await postChangePassword(password);
      showToast({ message: '비밀번호 변경 완료', image: 'EmojiCheckMarkButton', duration: 1000 });
      if (route.params.from === 'My') {
        const rootNav = navigation.getParent();
        rootNav!.reset({
          index: 0,
          routes: [{ name: 'NavBar', params: { screen: 'My' } }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'AccountManagePage' }] });
      }
    } catch (error) {
      showToast({ message: '비밀번호 변경 실패', image: 'EmojiRedExclamationMark', duration: 1000 });
      console.log('[NewPassword][postChangePassword] error: ', error);
    }
  };

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange((e: any) => {
      setHeight(e.softInputHeight);
      setSticky(true);
      if (e.softInputHeight === 0) setSticky(false);
    });
    return () => sub.remove();
  }, []);

  const dismissKb = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKb} accessible={false}>
      <SafeAreaView style={styles.container}>
        <CenterHeader
          title="비밀번호 변경"
          leftChilds={{
            icon: (
              <IconChevronLeft
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => navigation.goBack(),
          }}
        />
        <View style={{ flex: 1 }}>
          <AuthTextSection title="새 비밀번호를 입력해 주세요." desc="영문+숫자+특수문자 조합, 8~32자" />
          <View style={styles.textFieldContainer}>
            <TextField
              placeholder="비밀번호 입력"
              inputText={password}
              setInputText={setPassword}
              isPassword
              onBlur={() => {
                setIsPasswordTouched(true);
                setIsPasswordValid(passwordRegex.test(password));
              }}
              validation={{
                isValid: isPasswordTouched && !isPasswordValid,
                validState: isPasswordValid,
                validText: '비밀번호 조건을 다시 확인해 주세요.',
              }}
            />
            <TextField
              placeholder="비밀번호 확인"
              inputText={confirmPassword}
              setInputText={setConfirmPassword}
              isPassword
              validation={{
                isValid: !isSamePassword,
                validState: isSamePassword,
                validText: '다시 입력해 주세요.',
              }}
            />
          </View>
        </View>

        <View
          style={{
            backgroundColor: semanticColor.surface.white,
            paddingBottom: isAndroid ? height! : height! - insets.bottom,
          }}>
          <ToolBar children="비밀번호 변경하기" onPress={onPress} disabled={!password} isSticky={sticky} />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  textFieldContainer: {
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[24],
  },
});

export default NewPassword;
