import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, View } from 'react-native';

interface AuthTextSectionProps {
  title: string;
  desc: string;
  icon?: React.ReactNode;
}

const AuthTextSection = ({ title, desc, icon }: AuthTextSectionProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {icon}
      </View>
      <Text style={styles.desc}>{desc}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
  },
  titleContainer: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[4],
  },
  title: {
    color: semanticColor.text.primary,
    ...semanticFont.headline.medium,
  },
  desc: {
    color: semanticColor.text.tertiary,
    ...semanticFont.body.large,
  },
});

export default AuthTextSection;
