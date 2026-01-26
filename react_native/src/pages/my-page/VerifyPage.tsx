import { StyleSheet, Text } from 'react-native';
import CenterHeader from '@/components/common/header/CenterHeader';
import { View } from 'react-native';
import Chip from '@/components/common/Chip';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconX from '@/assets/icons/IconX.svg';
import { semanticColor } from '@/styles/semantic-color';
import { SafeAreaView } from 'react-native-safe-area-context';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import ToolBar from '@/components/common/button/ToolBar';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

function VerifyPage() {
  const isDone = false;
  const navigation = useMyNavigation();
  const rootNavigation = useRootNavigation();
  return (
    <SafeAreaView style={styles.verifyPageContainer}>
      <CenterHeader
        title={!isDone ? '개인 정보 수정' : ''}
        leftChilds={
          !isDone
            ? {
                icon: (
                  <IconChevronLeft
                    width={28}
                    height={28}
                    stroke={semanticColor.icon.primary}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                ),
                onPress: () => navigation.goBack(),
              }
            : undefined
        }
        rightChilds={
          isDone
            ? [
                {
                  icon: (
                    <IconX
                      width={28}
                      height={28}
                      stroke={semanticColor.icon.primary}
                      strokeWidth={semanticNumber.stroke.bold}
                    />
                  ),
                  onPress: () => navigation.navigate('VerifyInfoPage'),
                },
              ]
            : undefined
        }
      />
      <View style={styles.verifyPageContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.mainText}>{!isDone ? '개인 정보를 수정하시겠어요?' : '본인 인증이 완료되었어요.'}</Text>
          <Text style={styles.subText}>
            {!isDone ? '개인 정보를 수정하려면 본인 인증을 진행해야 합니다.' : '개인 정보가 수정되었습니다.'}
          </Text>
        </View>
        <View style={styles.chipWrapper}>
          <Chip text={!isDone ? '본인 인증 필요' : '본인 인증 완료'} variant="condition" />
        </View>
      </View>
      <ToolBar
        children={!isDone ? '본인 인증하기' : '확인'}
        onPress={
          !isDone
            ? () =>
                rootNavigation.replace('CertificationStack', { screen: 'Certification', params: { origin: 'common' } })
            : () => navigation.navigate('VerifyInfoPage')
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verifyPageContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  textWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[4],
  },
  mainText: {
    ...semanticFont.headline.medium,
    color: semanticColor.text.primary,
  },
  subText: {
    ...semanticFont.body.large,
    color: semanticColor.text.tertiary,
  },
  chipWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[24],
  },
});

export default VerifyPage;
