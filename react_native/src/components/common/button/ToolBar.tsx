import { Platform, StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import VariantButton, { VariantButtonProps } from '@/components/common/button/VariantButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToolBarProps {
  isHairLine?: boolean;
  isSticky?: boolean;
  isSafeArea?: boolean;
}

const isAndroid = Platform.OS === 'android';

function ToolBar({
  children,
  theme,
  isLarge = true,
  disabled,
  onPress,
  isHairLine,
  isSticky,
  isSafeArea = true,
}: VariantButtonProps & ToolBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.toolBarContainer,
        isHairLine && styles.hairLine,
        isSticky && !isAndroid && styles.styicky,
        !isSafeArea && {
          paddingBottom: isAndroid
            ? semanticNumber.spacing[10] + insets.bottom
            : semanticNumber.spacing[2] + insets.bottom,
        },
      ]}>
      <VariantButton children={children} theme={theme} isLarge={isLarge} onPress={onPress} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolBarContainer: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[10],
    paddingBottom: isAndroid ? semanticNumber.spacing[10] : semanticNumber.spacing[2],
  },
  hairLine: {
    borderTopColor: semanticColor.border.medium,
    borderTopWidth: semanticNumber.stroke.hairline,
  },
  styicky: {
    paddingBottom: semanticNumber.spacing[10],
  },
});

export default ToolBar;
