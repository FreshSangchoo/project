import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

interface MultiLineTextFieldProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
  maxLength: number;
}

const MultiLineTextField = ({ inputText, setInputText, placeholder, maxLength }: MultiLineTextFieldProps) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        value={inputText}
        onChangeText={setInputText}
        placeholder={placeholder}
        maxLength={maxLength}
        placeholderTextColor={semanticColor.text.tertiary}
        textContentType="none"
        {...(Platform.OS === 'android' && {
          autoCorrect: false,
          autoComplete: 'off',
        })}
      />
      <View style={styles.countTextWrapper}>
        <Text style={styles.countText}>
          {inputText.length} /{maxLength}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 190,
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  input: {
    flex: 1,
    color: semanticColor.text.primary,
    ...semanticFont.body.large,
    padding: 0,
    textAlignVertical: 'top',
  },
  countTextWrapper: {
    alignItems: 'flex-end',
  },
  countText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.caption.large,
  },
});

export default MultiLineTextField;
