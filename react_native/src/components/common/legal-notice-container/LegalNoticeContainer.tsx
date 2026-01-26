import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import Logo from '@/assets/logos/Logo.svg';
import { semanticColor } from '@/styles/semantic-color';
import { LEGAL_TEXT } from './constant/LegalNotice';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';

interface LegalNoticeProps {
  isExplore?: boolean;
}

const LegalNoticeContainer = ({ isExplore }: LegalNoticeProps) => {
  const handlePress = () => {
    Linking.openURL('https://www.ftc.go.kr/bizCommPop.do?wrkr_no=8504101498');
  };

  return (
    <View style={styles.container}>
      {!isExplore && (
        <>
          <Logo />
          <View>
            <Text style={styles.title}>{LEGAL_TEXT.businessInfo}</Text>
            <View style={styles.row}>
              <Text style={styles.title}>{LEGAL_TEXT.businessNumber}</Text>
              <TouchableOpacity onPress={handlePress}>
                <Text style={[styles.link, styles.title]}>사업자 정보 확인</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{LEGAL_TEXT.customerCenter}</Text>
            <Text style={styles.title}>{LEGAL_TEXT.mailOrderLicense}</Text>
          </View>
          <Text style={styles.title}>{LEGAL_TEXT.copyright}</Text>
        </>
      )}
      <Text style={styles.title}>{LEGAL_TEXT.disclaimer}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: semanticNumber.spacing[32],
    paddingRight: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[56],
    paddingLeft: semanticNumber.spacing[16],
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[20],
    backgroundColor: semanticColor.surface.lightGray,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[8],
  },
  title: {
    color: semanticColor.home.neutral600,
    ...semanticFont.caption.small,
  },
  link: {
    textDecorationLine: 'underline',
  },
});

export default LegalNoticeContainer;
