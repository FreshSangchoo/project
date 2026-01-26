import { semanticColor } from '@/styles/semantic-color';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import LogoNaver from '@/assets/icons/LogoNaver.svg';
import LogoKakao from '@/assets/icons/LogoKakao.svg';
import LogoApple from '@/assets/icons/LogoApple.svg';
import IconMail from '@/assets/icons/IconMail.svg';

type SignupOption = 'naver' | 'kakao' | 'apple' | 'email';

interface SignupOptionProps {
  option: SignupOption;
  onPress: () => void;
}

const SignupOption = ({ option, onPress }: SignupOptionProps) => {
  const signUpOptions = {
    naver: {
      title: '네이버로 계속하기',
      SignUpOptionLogo: LogoNaver,
      color: '#fff',
      backgroundColor: semanticColor.reference.naverGreen,
    },
    kakao: {
      title: '카카오로 계속하기',
      SignUpOptionLogo: LogoKakao,
      color: '#000000',
      backgroundColor: semanticColor.reference.kakaoYellow,
    },
    apple: {
      title: 'Apple로 계속하기',
      SignUpOptionLogo: LogoApple,
      color: semanticColor.text.primary,
      backgroundColor: semanticColor.surface.white,
    },
    email: {
      title: '이메일로 계속하기',
      SignUpOptionLogo: IconMail,
      color: semanticColor.text.secondaryOnDark,
      backgroundColor: semanticColor.surface.alphaWhiteLight,
    },
  };
  const { title, SignUpOptionLogo, color, backgroundColor } = signUpOptions[option];
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor }]} onPress={onPress}>
      <SignUpOptionLogo
        width={12}
        height={12}
        stroke={option == 'email' ? semanticColor.icon.tertiaryOnDark : undefined}
        strokeWidth={2}
      />
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    borderRadius: semanticNumber.borderRadius.md,
  },
  text: {
    fontSize: 17,
    fontWeight: 500,
    lineHeight: 24,
    includeFontPadding: false,
  },
});

export default SignupOption;
