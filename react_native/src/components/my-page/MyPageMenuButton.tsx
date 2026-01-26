import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { Pressable, StyleSheet, Text } from 'react-native';

interface UserMenuButtonProps {
  icon: React.ReactNode;
  text: string;
  onPress: () => void;
}

function UserMenuButton({ icon, text, onPress }: UserMenuButtonProps) {
  return (
    <Pressable style={styles.userMenuButton} onPress={onPress}>
      {icon}
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  userMenuButton: {
    flex: 1,
    gap: semanticNumber.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    color: semanticColor.text.secondary,
    ...semanticFont.body.small,
  },
});

export default UserMenuButton;
