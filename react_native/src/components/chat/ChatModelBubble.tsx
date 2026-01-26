import VariantButton from '@/components/common/button/VariantButton';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ChatModelBubbleProps {
  post?: {
    id: number;
    brandName: string;
    modelName: string;
    price: number;
    thumbnail: string;
  };
  onPress?: () => void;
}

function ChatModelBubble({ post, onPress }: ChatModelBubbleProps) {
  if (!post) return null;
  const priceText = `${Number(post.price).toLocaleString()}원`;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.bubble} onPress={onPress}>
        <View style={styles.modelWrapper}>
          <Image source={{ uri: post.thumbnail }} style={styles.modelImage} />
          <View style={[styles.modelInfo, !post.brandName && { justifyContent: 'center' }]}>
            {post.brandName && <Text style={styles.brandName}>{post.brandName}</Text>}
            <Text style={styles.modelName}>{post.modelName}</Text>
            <Text style={styles.price}>{priceText}</Text>
          </View>
        </View>
        <VariantButton children="매물 보러가기" onPress={onPress!} theme="sub" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: semanticNumber.spacing[16],
    alignItems: 'center',
  },
  bubble: {
    minWidth: 280,
    width: '70%',
    paddingHorizontal: semanticNumber.spacing[12],
    paddingTop: semanticNumber.spacing[12],
    paddingBottom: semanticNumber.spacing[2],
    gap: semanticNumber.spacing[12],
    borderRadius: semanticNumber.borderRadius.xl,
    borderWidth: semanticNumber.stroke.bold,
    borderColor: semanticColor.border.light,
  },
  modelWrapper: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[12],
  },
  modelImage: {
    width: 72,
    height: 72,
    borderRadius: semanticNumber.borderRadius.md,
  },
  modelInfo: {
    gap: semanticNumber.spacing[6],
  },
  brandName: {
    ...semanticFont.label.xxsmall,
    color: semanticColor.text.primary,
  },
  modelName: {
    ...semanticFont.label.xxsmall,
    color: semanticColor.text.secondary,
  },
  price: {
    ...semanticFont.title.medium,
    color: semanticColor.text.primary,
  },
});

export default ChatModelBubble;
