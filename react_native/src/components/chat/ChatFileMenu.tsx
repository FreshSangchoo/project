import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import IconPaperclip from '@/assets/icons/IconPaperclip.svg';
import IconCamera from '@/assets/icons/IconCamera.svg';
import IconPhoto from '@/assets/icons/IconPhoto.svg';

type ChatFileMenuProps = {
  visible: boolean;
  onClose: () => void;
  onPickFile: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
  bottom?: number;
  left?: number;
  overlayBottom?: number;
};

function ChatFileMenu({
  visible,
  onClose,
  onPickFile,
  onPickCamera,
  onPickGallery,
  bottom,
  left = 8,
  overlayBottom,
}: ChatFileMenuProps) {
  if (!visible) return null;

  const menuItems = [
    {
      icon: (
        <IconPaperclip
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      text: '파일 공유하기',
      onPress: onPickFile,
    },
    {
      icon: (
        <IconCamera
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      text: '카메라로 촬영하기',
      onPress: onPickCamera,
    },
    {
      icon: (
        <IconPhoto
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      text: '갤러리에서 선택하기',
      onPress: onPickGallery,
    },
  ];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable style={[styles.overlay, { bottom: overlayBottom }]} onPress={onClose} />
      <View style={[styles.menu, { left, bottom }]}>
        {menuItems.map((item, idx) => {
          const isLast = idx === menuItems.length - 1;
          return (
            <Pressable
              key={item.text}
              style={({ pressed }) => [
                styles.item,
                !isLast && styles.itemDivider,
                pressed && { backgroundColor: semanticColor.surface.lightGray },
              ]}
              android_ripple={{ color: semanticColor.surface.lightGray }}
              onPress={() => {
                onClose();
                item.onPress();
              }}>
              {item.icon}
              <Text style={[semanticFont.body.medium, { color: semanticColor.text.primary }]}>{item.text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: semanticColor.surface.alphaBlackLight,
  },
  menu: {
    position: 'absolute',
    backgroundColor: semanticColor.surface.white,
    borderRadius: semanticNumber.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  item: {
    width: 198,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[12],
  },
  itemDivider: {
    borderBottomColor: semanticColor.border.medium,
    borderBottomWidth: semanticNumber.stroke.xlight,
  },
});

export default ChatFileMenu;
