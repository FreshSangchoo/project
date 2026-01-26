import AuthTextSection from '@/components/auth/AuthTextSection';
import CenterHeader from '@/components/common/header/CenterHeader';
import TextField from '@/components/common/text-field/TextField';
import useAuthApi from '@/hooks/apis/useAuthApi';
import useMyNavigation, { MyStackParamList } from '@/hooks/navigation/useMyNavigation';
import { semanticNumber } from '@/styles/semantic-number';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticColor } from '@/styles/semantic-color';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import ToolBar from '@/components/common/button/ToolBar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useToastStore } from '@/stores/toastStore';

type ChangePasswordRoute = RouteProp<MyStackParamList, 'ChangePassword'>;

const isAndroid = Platform.OS === 'android';

function ChangePassword() {
  const navigation = useMyNavigation();
  const route = useRoute<ChangePasswordRoute>();
  const [password, setPassword] = useState('');
  const [isValid, setIsValid] = useState<boolean | undefined>(undefined);
  const { postVerifyPassword } = useAuthApi();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const [sticky, setSticky] = useState(false);

  const showToast = useToastStore(s => s.show);

  const onPress = async () => {
    try {
      await postVerifyPassword(password);
      showToast({ message: '인증 완료!', image: 'EmojiCheckMarkButton', duration: 1000 });
      navigation.replace('NewPassword', { from: route.params.from });
    } catch (error) {
      showToast({ message: '비밀번호가 맞지 않아요.', image: 'EmojiRedExclamationMark', duration: 1000 });
      setIsValid(true);
      if (__DEV__) {
        console.log('[ChangePassword][postVerifyPassword] error: ', error);
      }
    }
  };

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange((e: any) => {
      setHeight(e.softInputHeight);
      setSticky(e.softInputHeight !== 0);
    });
    return () => sub.remove();
  }, []);

  const dismissKb = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKb} accessible={false}>
      <SafeAreaView style={styles.changePassword}>
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
          <AuthTextSection title="비밀번호를 변경하시겠어요?" desc="기존 비밀번호를 먼저 입력해 주세요." />
          <View style={styles.textFieldSection}>
            <TextField
              label="기존 비밀번호"
              placeholder="비밀번호 입력"
              isPassword
              inputText={password}
              setInputText={setPassword}
              validation={{
                isValid: isValid,
                validState: !isValid,
                validText: '다시 입력해 주세요.',
              }}
              onSubmitEditing={onPress}
            />
          </View>
        </View>
        <View
          style={{
            backgroundColor: semanticColor.surface.white,
            paddingBottom: isAndroid ? height! : height! - insets.bottom,
          }}>
          <ToolBar children="다음" onPress={onPress} disabled={!password} isSticky={sticky} />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  changePassword: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  container: {
    height: '100%',
    position: 'relative',
  },
  textFieldSection: {
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
  },
  mainButtonContainer: {
    width: '100%',
    position: 'absolute',
    paddingHorizontal: semanticNumber.spacing[16],
    bottom: semanticNumber.spacing[36],
  },
});

export default ChangePassword;
