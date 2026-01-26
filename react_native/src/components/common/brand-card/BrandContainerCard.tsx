import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import Chip from '@/components/common/Chip';
import IconChevronRight from '@/assets/icons/IconChevronRight.svg';

interface BrandContainerCardProps {
  brand: string;
  korBrandName?: string;
  onPress: () => void;
}

function BrandContainerCard({ brand, korBrandName, onPress }: BrandContainerCardProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <View style={styles.textGroup}>
          <Text style={styles.brandText}>{brand}</Text>
          {korBrandName && <Text style={styles.korNameText}>{korBrandName}</Text>}
        </View>
        <View style={styles.trailGroup}>
          <Chip text="브랜드" variant="condition" size="medium" />
          <IconChevronRight
            width={28}
            height={28}
            stroke={semanticColor.icon.primary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: semanticNumber.spacing[16],
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  textGroup: {
    flex: 1,
  },
  brandText: {
    color: semanticColor.text.primary,
    ...semanticFont.title.large,
  },
  korNameText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.body.small,
  },
  trailGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[8],
  },
});

export default BrandContainerCard;
