import { StyleSheet, View, Text } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import Chip from '@/components/common/Chip';
import { formatDate } from '@/utils/formatDate';

interface SellerInformationProps {
  joinDate: string;
  verified?: boolean;
}

function SellerInformation({ joinDate, verified }: SellerInformationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>가입일</Text>
          <Text style={styles.rowText}>{formatDate(joinDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>인증</Text>
          {verified ? <Chip text="본인인증 완료" variant="condition" /> : <Chip text="미인증" />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  infoContainer: {
    width: '100%',
    paddingVertical: semanticNumber.spacing[12],
  },
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
  },
  rowTitle: {
    flex: 1,
    color: semanticColor.text.primary,
    ...semanticFont.label.medium,
  },
  rowText: {
    color: semanticColor.text.primary,
    ...semanticFont.body.medium,
  },
});

export default SellerInformation;
