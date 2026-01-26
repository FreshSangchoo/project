import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';

export type PhotoItem = { url?: string; thumb?: string };

type PhotoGridProps = {
  items: PhotoItem[];
  uploading?: boolean;
  size?: number;
  borderRadius?: number;
  onPress?: (startIndex: number, images: string[]) => void;
};

export default function PhotoGrid({
  items,
  uploading = false,
  size = 160,
  borderRadius = semanticNumber.borderRadius.xl,
  onPress,
}: PhotoGridProps) {
  const count = items?.length ?? 0;
  const lineColor = semanticColor.border.medium;
  const images = React.useMemo(() => items.map(it => it.url || it.thumb!).filter(Boolean), [items]);

  const renderImage = (it?: PhotoItem) =>
    it?.thumb || it?.url ? (
      <Image source={{ uri: it.thumb || it.url }} style={styles.fill} resizeMode="cover" />
    ) : (
      <View style={{ flex: 1, backgroundColor: semanticColor.surface.lightGray }} />
    );

  const renderUploading = () =>
    uploading ? (
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>전송 중</Text>
      </View>
    ) : null;

  // 1장
  if (count <= 1) {
    const it = items?.[0];
    return (
      <View
        style={[styles.baseBox, { width: size, height: size, borderRadius, backgroundColor: lineColor, padding: 1 }]}>
        <Pressable style={[styles.innerBox, { borderRadius: borderRadius - 1 }]} onPress={() => onPress?.(0, images)}>
          {renderImage(it)}
        </Pressable>
        {renderUploading()}
      </View>
    );
  }

  // 2장
  if (count === 2) {
    const [left, right] = items;
    return (
      <View
        style={[styles.baseBox, { width: size, height: size, borderRadius, backgroundColor: lineColor, padding: 1 }]}>
        <View style={[styles.row, { borderRadius: borderRadius - 1, backgroundColor: lineColor }]}>
          <Pressable
            style={[styles.flex1, { backgroundColor: semanticColor.surface.white }]}
            onPress={() => onPress?.(0, images)}>
            {renderImage(left)}
          </Pressable>

          <View style={[styles.flex1, { paddingLeft: 1, backgroundColor: lineColor }]}>
            <Pressable
              onPress={() => onPress?.(1, images)}
              style={{
                flex: 1,
                backgroundColor: semanticColor.surface.white,
                borderTopRightRadius: borderRadius - 1,
                borderBottomRightRadius: borderRadius - 1,
                overflow: 'hidden',
              }}>
              {renderImage(right)}
            </Pressable>
          </View>
        </View>
        {renderUploading()}
      </View>
    );
  }

  // 3장
  if (count === 3) {
    const [left, topRight, bottomRight] = items;
    return (
      <View
        style={[styles.baseBox, { width: size, height: size, borderRadius, backgroundColor: lineColor, padding: 1 }]}>
        <View style={[styles.row, { borderRadius: borderRadius - 1, backgroundColor: lineColor }]}>
          <Pressable
            style={[styles.flex1, { backgroundColor: semanticColor.surface.white }]}
            onPress={() => onPress?.(0, images)}>
            {renderImage(left)}
          </Pressable>

          <View style={[styles.flex1, { paddingLeft: 1, backgroundColor: lineColor }]}>
            <Pressable
              onPress={() => onPress?.(1, images)}
              style={{
                flex: 1,
                backgroundColor: semanticColor.surface.white,
                borderTopRightRadius: borderRadius - 1,
                overflow: 'hidden',
              }}>
              {renderImage(topRight)}
            </Pressable>

            <View style={{ flex: 1, paddingTop: 1, backgroundColor: lineColor }}>
              <Pressable
                onPress={() => onPress?.(2, images)}
                style={{
                  flex: 1,
                  backgroundColor: semanticColor.surface.white,
                  borderBottomRightRadius: borderRadius - 1,
                  overflow: 'hidden',
                }}>
                {renderImage(bottomRight)}
              </Pressable>
            </View>
          </View>
        </View>
        {renderUploading()}
      </View>
    );
  }

  // 4장 이상: 2×2 (+n)
  const show = items.slice(0, 4);
  const rest = Math.max(0, count - 4);

  return (
    <View style={[styles.baseBox, { width: size, height: size, borderRadius, backgroundColor: lineColor, padding: 1 }]}>
      <View style={[styles.row, { borderRadius: borderRadius - 1, backgroundColor: lineColor }]}>
        <View style={[styles.flex1, { backgroundColor: semanticColor.surface.white }]}>
          <Pressable
            onPress={() => onPress?.(0, images)}
            style={{ flex: 1, overflow: 'hidden', borderTopLeftRadius: borderRadius - 1 }}>
            {renderImage(show[0])}
          </Pressable>

          <View style={{ flex: 1, paddingTop: 1, backgroundColor: lineColor }}>
            <Pressable
              onPress={() => onPress?.(2, images)}
              style={{
                flex: 1,
                overflow: 'hidden',
                borderBottomLeftRadius: borderRadius - 1,
                backgroundColor: semanticColor.surface.white,
              }}>
              {renderImage(show[2])}
            </Pressable>
          </View>
        </View>

        <View style={[styles.flex1, { paddingLeft: 1, backgroundColor: lineColor }]}>
          <Pressable
            onPress={() => onPress?.(1, images)}
            style={{
              flex: 1,
              overflow: 'hidden',
              borderTopRightRadius: borderRadius - 1,
              backgroundColor: semanticColor.surface.white,
            }}>
            {renderImage(show[1])}
          </Pressable>

          <View style={{ flex: 1, paddingTop: 1, backgroundColor: lineColor }}>
            <Pressable
              onPress={() => onPress?.(3, images)}
              style={{
                flex: 1,
                overflow: 'hidden',
                borderBottomRightRadius: borderRadius - 1,
                backgroundColor: semanticColor.surface.white,
              }}>
              {renderImage(show[3])}
              {rest > 0 && (
                <View style={styles.overlay}>
                  <Text style={styles.moreText}>+{rest}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      {renderUploading()}
    </View>
  );
}

const styles = StyleSheet.create({
  baseBox: {
    overflow: 'hidden',
    position: 'relative',
  },
  innerBox: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: semanticColor.surface.white,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  flex1: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: semanticColor.surface.alphaBlackStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    ...semanticFont.body.medium,
    color: semanticColor.text.brandOnDark,
  },
  moreText: {
    ...semanticFont.title.small,
    color: semanticColor.text.brandOnDark,
  },
});
