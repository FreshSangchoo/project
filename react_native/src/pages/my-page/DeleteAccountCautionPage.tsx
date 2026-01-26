import CenterHeader from '@/components/common/header/CenterHeader';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import { cautionList } from '@/constants/DeleteAccount';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToolBar from '@/components/common/button/ToolBar';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';

function DeleteAccountCautionPage() {
  const navigation = useMyNavigation();

  return (
    <SafeAreaView style={styles.deleteAccountCautionPage}>
      <CenterHeader
        title="탈퇴하기"
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
      <View style={styles.deleteAccountCautionPage}>
        <View style={styles.textWrapper}>
          <Text style={styles.mainText}>탈퇴하기 전 유의사항</Text>
          <Text style={styles.subText}>아키파이를 탈퇴하기 전 유의사항을 확인해주세요.</Text>
        </View>
        <View style={styles.contentsWrapper}>
          {cautionList.map(text => (
            <View key={text} style={styles.contentsRow}>
              <Text style={styles.contentsText}>•</Text>
              <Text style={styles.contentsText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
      <ToolBar children="확인했어요" onPress={() => navigation.navigate('DeleteAccountPage')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deleteAccountCautionPage: {
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
  contentsWrapper: {
    paddingLeft: semanticNumber.spacing[16],
    paddingRight: semanticNumber.spacing[32],
    paddingVertical: semanticNumber.spacing[24],
    gap: semanticNumber.spacing[8],
  },
  contentsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: semanticNumber.spacing[8],
  },
  contentsText: {
    ...semanticFont.body.medium,
    color: semanticColor.text.secondary,
  },
  buttonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[10],
  },
});

export default DeleteAccountCautionPage;
