import IconUser from '@/assets/icons/IconUser.svg';
import IconKey from '@/assets/icons/IconKey.svg';
import IconBell from '@/assets/icons/IconBell.svg';
import IconCircleMinus from '@/assets/icons/IconCircleMinus.svg';
import IconVersions from '@/assets/icons/IconVersions.svg';
import IconListCheck from '@/assets/icons/IconListCheck.svg';
import Chip from '@/components/common/Chip';
import { SectionItem } from '@/components/my-page/MyPageSection';
import { semanticColor } from '@/styles/semantic-color';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types/root';
import { semanticNumber } from '@/styles/semantic-number';
import { MyNav } from '@/hooks/navigation/useMyNavigation';
import { Guest, UserProfile } from '@/types/user';
import { providerToKorean } from '@/utils/providerToKorean';
import DeviceInfo from 'react-native-device-info';

type OnlyItemSection = Extract<SectionItem, { type: 'item' }>;

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export const accountSystemItems = (navigation: NativeStackNavigationProp<RootStackParamList>): SectionItem[] => [
  {
    type: 'item',
    itemImage: (
      <IconUser
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '계정 관리',
    onPress: () => navigation.navigate('MyStack', { screen: 'AccountManagePage' }),
    showNextButton: true,
  },
  {
    type: 'item',
    itemImage: (
      <IconKey
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '비밀번호 변경',
    onPress: () => navigation.navigate('MyStack', { screen: 'ChangePassword', params: { from: 'My' as const } }),
    showNextButton: true,
  },
  {
    type: 'item',
    itemImage: (
      <IconBell
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '알림 설정',
    onPress: () => navigation.navigate('MyStack', { screen: 'PushSettingPage' }),
    showNextButton: true,
  },
  {
    type: 'item',
    itemImage: (
      <IconCircleMinus
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '차단한 사용자',
    onPress: () => navigation.navigate('MyStack', { screen: 'BlockedUserList' }),
    showNextButton: true,
  },
];

export const accountSystemSocialItems = (navigation: NativeStackNavigationProp<RootStackParamList>): SectionItem[] => [
  {
    type: 'item',
    itemImage: (
      <IconUser
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '계정 관리',
    onPress: () => navigation.navigate('MyStack', { screen: 'AccountManagePage' }),
    showNextButton: true,
  },
  {
    type: 'item',
    itemImage: (
      <IconBell
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '알림 설정',
    onPress: () => navigation.navigate('MyStack', { screen: 'PushSettingPage' }),
    showNextButton: true,
  },
  {
    type: 'item',
    itemImage: (
      <IconCircleMinus
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '차단한 사용자',
    onPress: () => navigation.navigate('MyStack', { screen: 'BlockedUserList' }),
    showNextButton: true,
  },
];

export const serviceInfoItems = (navigation: NativeStackNavigationProp<RootStackParamList>): SectionItem[] => [
  {
    type: 'item',
    itemImage: (
      <IconVersions
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '버전 정보',
    subItem: DeviceInfo.getVersion(),
  },
  {
    type: 'item',
    itemImage: (
      <IconListCheck
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '약관 및 정책',
    onPress: () => navigation.navigate('MyStack', { screen: 'TermsAndConditionsPage' }),
    showNextButton: true,
  },
];

export const mySocialInfoItems = (
  navigation: MyNav,
  profile: UserProfile | Guest | null,
  rootNavigation: RootNav,
): SectionItem[] => [
  {
    type: 'item',
    itemName: '가입 유형',
    subItem: providerToKorean(profile!.provider) || '??',
  },
  {
    type: 'item',
    itemName: '이메일',
    subItem: profile?.email,
  },
  {
    type: 'item',
    itemName: '이름',
    subItem: profile!.name,
    onPress: () => {
      if (profile?.verified) navigation.navigate('VerifyInfoPage');
      else rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
    },
    showNextButton: true,
  },
  {
    type: 'item',
    itemName: '휴대폰 번호',
    subItem: profile!.phone!.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'),
    onPress: () => {
      if (profile?.verified) navigation.navigate('VerifyInfoPage');
      else rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
    },
    showNextButton: true,
  },
  {
    type: 'item',
    itemName: '본인인증',
    subItem: (
      <Chip
        text={profile!.verified ? '본인인증 완료' : '미인증'}
        variant={profile?.verified ? 'condition' : 'default'}
      />
    ),
    onPress: () => {
      if (profile?.verified) navigation.navigate('VerifyInfoPage');
      else rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
    },
    showNextButton: true,
  },
];

/** 이메일 로그인 사용자 정보 섹션 */
export const myEmailInfoItems = (
  navigation: MyNav,
  profile: UserProfile | Guest | null,
  rootNavigation: RootNav,
): SectionItem[] => [
  {
    type: 'item',
    itemName: '가입 유형',
    subItem: '이메일',
  },
  {
    type: 'item',
    itemName: '이메일',
    subItem: profile?.email,
  },
  {
    type: 'item',
    itemName: '이름',
    subItem: profile?.name,
    onPress: () => {
      if (profile?.verified) navigation.navigate('VerifyInfoPage');
      else rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
    },
    showNextButton: true,
  },
  {
    type: 'item',
    itemName: '휴대폰 번호',
    subItem: profile?.phone!.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3'),
    onPress: () => {
      if (profile?.verified) navigation.navigate('VerifyInfoPage');
      else rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
    },
    showNextButton: true,
  },
  {
    type: 'item',
    itemName: '본인인증',
    subItem: (
      <Chip
        text={profile?.verified ? '본인인증 완료' : '미인증'}
        variant={profile?.verified ? 'condition' : 'default'}
      />
    ),
    onPress: () => {
      if (profile?.verified) navigation.navigate('VerifyInfoPage');
      else rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
    },
    showNextButton: true,
  },
  {
    type: 'item',
    itemName: '비밀번호 변경',
    onPress: () => navigation.navigate('ChangePassword', { from: 'AccountManagePage' }),
    showNextButton: true,
  },
];

/** 위험 섹션 */
export const dangerSectionItems = (navigation: MyNav, openLogoutModal: () => void): SectionItem[] => [
  {
    type: 'item',
    itemName: '로그아웃',
    itemNameStyle: 'tertiary',
    onPress: () => openLogoutModal(),
    showNextButton: true,
  },
  {
    type: 'item',
    itemName: '탈퇴하기',
    itemNameStyle: 'critical',
    onPress: () => navigation.navigate('DeleteAccountCautionPage'),
    showNextButton: true,
  },
];

/** 푸시/채팅/마케팅 알림 토글 섹션들 */
export const pushAlarmItems = (toggleState: boolean, onToggle: () => void, disabled?: boolean): SectionItem[] => [
  {
    type: 'toggle',
    itemName: '전체 알림 받기',
    toggleState,
    onToggle,
    disabled,
  },
];

export const chattingAlarmItems = (toggleState: boolean, onToggle: () => void, disabled?: boolean): SectionItem[] => [
  {
    type: 'toggle',
    itemName: '전체 메시지 알림 받기',
    description: '참고: 채팅 메뉴에서 개별 채팅방 알림 조절 기능',
    toggleState,
    onToggle,
    disabled,
  },
];

export const marketingAlarmItems = (toggleState: boolean, onToggle: () => void, disabled?: boolean): SectionItem[] => [
  {
    type: 'toggle',
    itemName: '마케팅 알림 받기',
    description: '혜택 및 이벤트 정보',
    toggleState,
    onToggle,
    disabled,
  },
];

/** 약관 섹션 */
export const termsAndConditionsItems = (openURL: (url: string) => void): OnlyItemSection[] => [
  {
    type: 'item',
    itemName: '서비스 이용약관',
    showNextButton: true,
    onPress: () => openURL('https://jammering-support.notion.site/info-terms-of-use'),
  },
  {
    type: 'item',
    itemName: '개인정보 처리방침',
    showNextButton: true,
    onPress: () => openURL('https://jammering-support.notion.site/info-privacy-consent'),
  },
];
