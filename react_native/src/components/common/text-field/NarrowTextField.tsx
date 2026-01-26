import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

interface NarrowTextFieldProps {
  placeholder: string;
  inputText: string;
  setInputText: (text: string) => void;
  onPress: () => void;
}

const NarrowTextField = ({ placeholder, inputText, setInputText, onPress }: NarrowTextFieldProps) => {
  return (
    <View style={styles.container}>
      <TextInput
        value={inputText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={semanticColor.text.lightest}
        onChangeText={text => {
          setInputText(text);
        }}
        onSubmitEditing={onPress}
        textContentType="none"
        {...(Platform.OS === 'android' && {
          autoCorrect: false,
          autoComplete: 'off',
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: semanticNumber.spacing[8],
    paddingHorizontal: semanticNumber.spacing[12],
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  input: {
    flex: 1,
    minHeight: semanticNumber.spacing[22],
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: semanticColor.text.primary,
    ...semanticFont.body.large,
  },
});

export default NarrowTextField;
