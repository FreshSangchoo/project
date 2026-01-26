import MultiLineTextField from '@/components/common/text-field/MultiLineTextField';
import TextSection from '@/components/common/TextSection';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, View } from 'react-native';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import { useShallow } from 'zustand/react/shallow';
import { useCallback } from 'react';

function UploadDescription() {
  const { description, setDescription } = useUploadDataStore(
    useShallow(s => ({
      description: s.description ?? '',
      setDescription: s.setDescription,
    })),
  );

  const setInputText = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    next => {
      const prev = useUploadDataStore.getState().description ?? '';
      const value = typeof next === 'function' ? (next as (p: string) => string)(prev) : next;
      setDescription(value);
    },
    [setDescription],
  );

  return (
    <View style={styles.uploadDescription}>
      <TextSection mainText="추가 정보" subText="상세 설명이 필요하다면 작성해 주세요." type="small" />
      <View style={styles.textFieldWrapper}>
        <MultiLineTextField
          inputText={description}
          maxLength={1000}
          placeholder="추가 정보 입력"
          setInputText={setInputText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadDescription: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: 160,
  },
  textFieldWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
  },
});

export default UploadDescription;
