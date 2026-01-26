import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { View, StyleSheet, Text } from 'react-native';

type SectionSeparatorType = 'line-with-padding' | 'line' | 'rectangle' | 'vertical' | 'date';

interface SectionSeparatorProps {
  type?: SectionSeparatorType;
  height?: number;
  date?: string;
}

const SectionSeparator = ({ type = 'line', height, date }: SectionSeparatorProps) => {
  switch (type) {
    case 'line-with-padding':
      return <View style={[styles.lineWithPadding]} />;
    case 'rectangle':
      return <View style={[styles.rectangle]} />;
    case 'vertical':
      return <View style={[styles.vertical, { height: height }]} />;
    case 'date':
      return (
        <View style={styles.dateWrapper}>
          <Text style={styles.dateText}>{date}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    case 'line':
    default:
      return <View style={[styles.line]} />;
  }
};

const styles = StyleSheet.create({
  lineWithPadding: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: semanticColor.border.medium,
  },
  line: {
    height: 1,
    marginVertical: 8,
    backgroundColor: semanticColor.border.medium,
  },
  rectangle: {
    height: 16,
    backgroundColor: semanticColor.surface.gray,
  },
  vertical: {
    width: 1,
    marginHorizontal: 4,
    backgroundColor: semanticColor.border.medium,
    flexShrink: 0,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[8],
    gap: semanticNumber.spacing[12],
  },
  dateLine: {
    flex: 1,
    height: 1,
    marginVertical: 8,
    backgroundColor: semanticColor.border.medium,
  },
  dateText: {
    ...semanticFont.label.medium,
    color: semanticColor.text.tertiary,
  },
});

export default SectionSeparator;
