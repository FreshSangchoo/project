import { StyleSheet, View, Text } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Chip from '@/components/common/Chip';

interface BrandCardProps {
  brand: string;
  korBrandName?: string;
  isLoading?: boolean;
}

function BrandCard({ brand, korBrandName, isLoading }: BrandCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        {isLoading ? (
          <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
            <View style={{ gap: semanticNumber.spacing[8] }}>
              <SkeletonPlaceholder.Item width={264} height={36} borderRadius={semanticNumber.borderRadius.sm} />
              <SkeletonPlaceholder.Item width={124} height={18} borderRadius={semanticNumber.borderRadius.sm} />
            </View>
          </SkeletonPlaceholder>
        ) : (
          <>
            <Text style={styles.brandText}>{brand}</Text>
            {korBrandName && <Text style={styles.korNameText}>{korBrandName}</Text>}
          </>
        )}
      </View>
      <View style={{ justifyContent: 'center' }}>
        <Chip text="브랜드" variant="condition" size="medium" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[20],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
  },
  textGroup: {
    flex: 1,
  },
  brandText: {
    color: semanticColor.text.primary,
    ...semanticFont.headline.large,
  },
  korNameText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.body.medium,
  },
});

export default BrandCard;
