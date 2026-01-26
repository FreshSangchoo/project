import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TextSectionProps {
  mainText: string;
  subText: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  type?: 'large' | 'small';
}

function TextSection({ mainText, subText, icon, onPress, type = 'large' }: TextSectionProps) {
  return type === 'large' ? (
    <View style={largeStyles.textSection}>
      <View style={largeStyles.textWrapper}>
        <Text style={largeStyles.mainText}>{mainText}</Text>
        <Text style={largeStyles.subText}>{subText}</Text>
      </View>
      <TouchableOpacity onPress={onPress}>{icon}</TouchableOpacity>
    </View>
  ) : (
    <View style={smallStyles.textSection}>
      <View style={smallStyles.textWrapper}>
        <Text style={smallStyles.mainText}>{mainText}</Text>
        <Text style={smallStyles.subText}>{subText}</Text>
      </View>
      <TouchableOpacity onPress={onPress} style={smallStyles.iconWrapper}>
        {icon}
      </TouchableOpacity>
    </View>
  );
}

const largeStyles = StyleSheet.create({
  textSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
  },
  textWrapper: {
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
});

const smallStyles = StyleSheet.create({
  textSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: semanticNumber.spacing[16],
  },
  textWrapper: {
    gap: semanticNumber.spacing[4],
  },
  mainText: {
    ...semanticFont.title.large,
    color: semanticColor.text.primary,
  },
  subText: {
    ...semanticFont.body.small,
    color: semanticColor.text.tertiary,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default TextSection;
