import React, { useMemo } from 'react';
import ActionBottomSheet, { ActionItem } from '@/components/common/bottom-sheet/ActionBottomSheet';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import IconCamera from '@/assets/icons/IconCamera.svg';
import IconPhoto from '@/assets/icons/IconPhoto.svg';

type Props = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickGallery: () => void;
  isSafeArea?: boolean;
};

export default function PhotoSourceActionSheet({
  visible,
  onClose,
  onTakePhoto,
  onPickGallery,
  isSafeArea = true,
}: Props) {
  const items: ActionItem[] = useMemo(
    () => [
      {
        itemName: '카메라로 촬영하기',
        itemImage: (
          <IconCamera
            width={20}
            height={20}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        ),
        onPress: async () => {
          try {
            await onTakePhoto();
          } finally {
            onClose();
          }
        },
      },
      {
        itemName: '갤러리에서 선택하기',
        itemImage: (
          <IconPhoto
            width={20}
            height={20}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        ),
        onPress: async () => {
          try {
            await onPickGallery();
          } finally {
            onClose();
          }
        },
      },
    ],
    [onClose, onPickGallery, onTakePhoto],
  );

  return <ActionBottomSheet visible={visible} onClose={onClose} items={items} isSafeArea={isSafeArea} />;
}
