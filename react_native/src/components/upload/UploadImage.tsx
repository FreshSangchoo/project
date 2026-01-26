import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import IconInfoCircle from '@/assets/icons/IconInfoCircle.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import TextSection from '@/components/common/TextSection';
import { semanticFont } from '@/styles/semantic-font';
import IconCamera from '@/assets/icons/IconCamera.svg';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import VariantButton from '@/components/common/button/VariantButton';
import IconCircleMinus from '@/assets/icons/IconCircleMinus.svg';
import PhotoGuideBottomSheet from '@/components/common/bottom-sheet/PhotoGuideBottomSheet';
import { launchImageLibrary, launchCamera, Asset, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import { useUploadFormStore, UploadFormStore } from '@/stores/useUploadFormStore';
import { useShallow } from 'zustand/react/shallow';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import PhotoBottomSheet from '../common/bottom-sheet/PhotoBottomSheet';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

function UploadImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [skeletonCount, setSkeletonCount] = useState(0);
  const batchIdRef = useRef(0);

  const [photoGuideSheet, setPhotoGuideSheet] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const MAX = 10;

  const images = useUploadDataStore(s => s.images);
  const setImages = useUploadDataStore(s => s.setImages);
  const pushRemovedImageUrl = useUploadDataStore(s => s.pushRemovedImageUrl);

  const imageCount = Array.isArray(images) ? images.length : 0;

  const { showValidation, reportValidity, imageValid } = useUploadFormStore(
    useShallow((state: UploadFormStore) => ({
      showValidation: state.showValidation,
      reportValidity: state.reportValidity,
      imageValid: state.sections.images.valid,
    })),
  );

  useEffect(() => {
    const valid = imageCount > 0;
    reportValidity('images', valid, valid ? undefined : '사진을 추가해 주세요.');
  }, [imageCount, reportValidity]);

  const toItems = (uris: string[]) => uris.map(u => ({ uri: u, isRemote: /^https?:\/\//.test(u) }));

  const computeNewUris = (incoming: string[], currentUris: string[]) => {
    const capacity = Math.max(0, MAX - currentUris.length);
    if (capacity <= 0) return [];
    const uniques = incoming.filter(u => !currentUris.includes(u));
    return uniques.slice(0, capacity);
  };

  const waitForUri = (uri: string) => {
    return new Promise<void>(resolve => {
      if (/^https?:\/\//.test(uri)) {
        Image.prefetch(uri).finally(() => resolve());
      } else {
        Image.getSize(
          uri,
          () => resolve(),
          () => resolve(),
        );
      }
    });
  };

  const stageAndLoad = async (newUris: string[], currentUris: string[]) => {
    setIsLoading(true);
    setSkeletonCount(newUris.length);

    const myBatch = ++batchIdRef.current;

    await Promise.all(newUris.map(waitForUri));

    if (batchIdRef.current !== myBatch) return;

    const next = [...currentUris, ...newUris].slice(0, MAX);
    setImages(toItems(next));

    setIsLoading(false);
    setSkeletonCount(0);
  };

  const pushImages = (assets?: Asset[]) => {
    if (!assets || assets.length === 0) return;
    const uris = assets.map(a => a.uri).filter((u): u is string => !!u);
    if (!uris.length) return;

    const currentUris = (images ?? []).map(i => i.uri);
    const newUris = computeNewUris(uris, currentUris);
    if (newUris.length === 0) return;

    stageAndLoad(newUris, currentUris);
  };

  // 앨범 선택 권한
  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : 0;
    const perm =
      androidVersion >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(perm!);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // 카메라 촬영 권한
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA!);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // 앨범에서 선택하기
  const pickFromGallery = async () => {
    if (imageCount >= MAX || isLoading) return;
    const ok = await requestGalleryPermission();
    if (!ok) {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: Math.max(1, MAX - imageCount),
      quality: 0.7,
      maxWidth: 2000,
      maxHeight: 2000,
    };
    const res = await launchImageLibrary(options);
    if (res.didCancel) return;
    pushImages(res.assets);
  };

  // 카메라로 촬영하기
  const takePhoto = async () => {
    if (imageCount >= MAX || isLoading) return;
    const ok = await requestCameraPermission();
    if (!ok) {
      Alert.alert('권한 필요', '사진을 촬영하려면 카메라 권한이 필요합니다.');
      return;
    }
    const options: CameraOptions = { mediaType: 'photo', saveToPhotos: true, cameraType: 'back', quality: 0.9 };
    const res = await launchCamera(options);
    if (res.didCancel) return;
    pushImages(res.assets);
  };

  // 이미지 제거
  const handleRemove = (idx: number) => {
    const target = images?.[idx];
    const currentUris = (images ?? []).map(i => i.uri);
    const next = currentUris.filter((_, i) => i !== idx);
    setImages(toItems(next));
    if (target?.isRemote) pushRemovedImageUrl(target.uri);
  };

  const visibleImages = useMemo(() => images ?? [], [images]);

  return (
    <View style={styles.uploadImage}>
      <TextSection
        mainText="사진"
        subText="다양하고 상세한 사진을 첨부해주세요."
        icon={
          <IconInfoCircle
            width={28}
            height={28}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        }
        onPress={() => setPhotoGuideSheet(true)}
        type="small"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.uploadImageWrapper}>
        <View>
          <TouchableOpacity
            style={styles.uploadImageButton}
            onPress={() => setPhotoVisible(true)}
            disabled={imageCount >= MAX || isLoading}
            accessibilityLabel="사진 추가">
            <IconCamera
              width={24}
              height={24}
              stroke={semanticColor.icon.tertiary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          </TouchableOpacity>
          <View style={styles.countWrapper}>
            <Text style={styles.imageCount}>
              {imageCount}/{MAX}
            </Text>
          </View>
        </View>

        {isLoading &&
          Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonPlaceholder key={`sk-${i}`} speed={1400} backgroundColor={semanticColor.surface.lightGray}>
              <SkeletonPlaceholder.Item width={72} height={72} borderRadius={semanticNumber.borderRadius.lg} />
              <View style={styles.skeletonButtonWrapper}>
                <SkeletonPlaceholder.Item width={72} height={24} borderRadius={semanticNumber.borderRadius.md} />
              </View>
            </SkeletonPlaceholder>
          ))}

        {!isLoading &&
          visibleImages.map((it, idx) => (
            <View key={`${it.uri}-${idx}`}>
              <Image source={{ uri: it.uri }} style={styles.uploadedImage} resizeMode="cover" />
              <VariantButton onPress={() => handleRemove(idx)} theme="main" isFull>
                <IconCircleMinus
                  width={16}
                  height={16}
                  stroke={semanticColor.icon.primaryOnDark}
                  strokeWidth={semanticNumber.stroke.light}
                />
              </VariantButton>
            </View>
          ))}
      </ScrollView>

      <PhotoGuideBottomSheet visible={photoGuideSheet} onClose={() => setPhotoGuideSheet(false)} />

      <PhotoBottomSheet
        visible={photoVisible}
        onClose={() => setPhotoVisible(false)}
        onTakePhoto={async () => {
          setPhotoVisible(false);
          await takePhoto();
        }}
        onPickGallery={async () => {
          setPhotoVisible(false);
          await pickFromGallery();
        }}
      />

      {showValidation && !imageValid && (
        <View style={styles.captionWrapper}>
          <IconAlertCircle
            width={16}
            height={16}
            stroke={semanticColor.icon.critical}
            strokeWidth={semanticNumber.stroke.bold}
          />
          <Text style={styles.captionText}>정상적으로 업로드 된 사진 1장 이상을 추가해 주세요.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  uploadImage: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[32],
  },
  uploadImageWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[16],
  },
  uploadImageButton: {
    width: 72,
    height: 72,
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.border.strong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedImage: {
    width: 72,
    height: 72,
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countWrapper: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCount: {
    ...semanticFont.caption.large,
    color: semanticColor.text.tertiary,
  },
  captionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
    marginTop: semanticNumber.spacing[8],
    paddingHorizontal: semanticNumber.spacing[16],
  },
  captionText: {
    ...semanticFont.caption.large,
    color: semanticColor.text.critical,
  },
  skeletonButtonWrapper: {
    paddingVertical: semanticNumber.spacing[8],
  },
});

export default UploadImage;
