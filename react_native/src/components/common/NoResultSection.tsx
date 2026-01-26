import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, View } from 'react-native';

interface NoResultSectionProps {
  emoji: React.ReactNode;
  title: string;
  description?: string;
  button?: React.ReactNode;
}

// button 부분은 버튼 컴포넌트 사용
function NoResultSection({ emoji, title, description, button }: NoResultSectionProps) {
  return (
    <View style={styles.noResultSection}>
      <View style={styles.infoWrapper}>
        {emoji}
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.descriptionText}>{description}</Text>
      </View>
      {button}
    </View>
  );
}

const styles = StyleSheet.create({
  noResultSection: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: semanticNumber.spacing[24],
  },
  infoWrapper: {
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  titleText: {
    ...semanticFont.body.mediumStrong,
    color: semanticColor.text.secondary,
  },
  descriptionText: {
    ...semanticFont.body.small,
    color: semanticColor.text.secondary,
  },
});

export default NoResultSection;
