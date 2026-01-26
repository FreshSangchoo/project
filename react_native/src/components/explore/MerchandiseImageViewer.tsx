import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import type { ImageSource } from 'react-native-image-viewing/dist/@types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import IconX from '@/assets/icons/IconX.svg';

type Props = {
  visible: boolean;
  images: string[] | ImageSource[];
  index: number;
  onClose: () => void;
  onIndexChange?: (idx: number) => void;
  backgroundColor?: string;
};

function normalizeImages(list: Props['images']): ImageSource[] {
  return list.map(item => (typeof item === 'string' ? { uri: item } : item));
}

export default function MerchandiseImageViewer({
  visible,
  images,
  index,
  onClose,
  onIndexChange,
  backgroundColor = semanticColor.surface.dark,
}: Props) {
  const insets = useSafeAreaInsets();
  const imgs = React.useMemo(() => normalizeImages(images), [images]);

  return (
    <ImageViewing
      images={imgs}
      imageIndex={index}
      visible={visible}
      onRequestClose={onClose}
      onImageIndexChange={onIndexChange}
      swipeToCloseEnabled
      presentationStyle="overFullScreen"
      backgroundColor={backgroundColor}
      HeaderComponent={({ imageIndex }) => (
        <View style={[styles.viewerHeader, Platform.OS === 'ios' ? { paddingTop: insets.top } : { paddingTop: 10 }]}>
          <View style={styles.headerRow}>
            <View style={styles.counter}>
              <Text style={styles.counterText}>{imageIndex + 1}</Text>
              <Text style={styles.counterText}>/{imgs.length}</Text>
            </View>
            <TouchableOpacity style={styles.iconTouch} onPress={onClose}>
              <IconX
                width={28}
                height={28}
                stroke={semanticColor.icon.primaryOnDark}
                strokeWidth={semanticNumber.stroke.bold}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: semanticNumber.spacing[6],
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
  },
  counterText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.caption.large,
  },
  iconTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
});
