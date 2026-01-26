import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, View } from 'react-native';
import Toggle from '@/components/my-page/Toggle';
import { semanticColor } from '@/styles/semantic-color';

export interface SettingToggleProps {
  itemName: string;
  description?: string;
  toggleState: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function SettingToggle({ itemName, description, toggleState, onToggle, disabled }: SettingToggleProps) {
  return (
    <View style={styles.settingToggle}>
      <View style={disabled && { opacity: 0.4 }}>
        <Text style={styles.itemNameText}>{itemName}</Text>
        {description && <Text style={styles.descriptionText}>{description}</Text>}
      </View>
      <Toggle isOn={toggleState} onToggle={onToggle} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  settingToggle: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[12],
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
  },

  itemNameText: {
    ...semanticFont.label.medium,
    color: semanticColor.text.primary,
  },
  descriptionText: {
    ...semanticFont.caption.medium,
    color: semanticColor.text.tertiary,
  },
  toggle: {
    transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
  },
});

export default SettingToggle;
