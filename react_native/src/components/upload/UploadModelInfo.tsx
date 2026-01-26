import { StyleSheet, View } from 'react-native';
import TextSection from '@/components/common/TextSection';
import { semanticNumber } from '@/styles/semantic-number';
import ModelCard, { ModelCardProps } from '@/components/common/model-card/ModelCard';

interface UploadModelInfo {
  modelId: number;
}

function UploadModelInfo({ brand, modelName, category, onPress }: ModelCardProps) {
  return (
    <View style={styles.uploadModelInfo}>
      <TextSection mainText="모델 정보" subText="선택한 모델의 이름이 게시글의 제목으로 올라가요!" type="small" />
      <View style={styles.modelCardWrapper}>
        <ModelCard brand={brand} category={category} modelName={modelName} onPress={onPress} noNextButton={true} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadModelInfo: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[32],
  },
  modelCardWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
  },
});

export default UploadModelInfo;
