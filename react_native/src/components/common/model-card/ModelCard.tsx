import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import NextButton from '@/assets/icons/IconChevronRight.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';

export interface ModelCardProps {
  brand?: string;
  modelName: string;
  category: string;
  onPress?: () => void;
  noNextButton?: boolean;
}

function ModelCard({ brand, modelName, category, onPress, noNextButton }: ModelCardProps) {
  return (
    <TouchableOpacity style={styles.modelCardContainer} onPress={onPress} disabled={noNextButton}>
      <View style={styles.modelInfoWrapper}>
        {brand && <Text style={styles.brandText}>{brand}</Text>}
        <Text style={styles.modelNameText} numberOfLines={1} ellipsizeMode="tail">
          {modelName}
        </Text>
        <Text style={styles.categoryText}>{category}</Text>
      </View>
      {!noNextButton && (
        <NextButton
          width={28}
          height={28}
          stroke={semanticColor.icon.primary}
          strokeWidth={semanticNumber.stroke.bold}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modelCardContainer: {
    padding: semanticNumber.spacing[16],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  modelInfoWrapper: {
    gap: semanticNumber.spacing[4],
    flex: 1,
  },
  brandText: {
    ...semanticFont.body.smallStrong,
    color: semanticColor.text.tertiary,
  },
  modelNameText: {
    ...semanticFont.title.medium,
    color: semanticColor.text.primary,
    flexShrink: 1,
  },
  categoryText: {
    ...semanticFont.caption.medium,
    color: semanticColor.text.tertiary,
  },
});

export default ModelCard;
