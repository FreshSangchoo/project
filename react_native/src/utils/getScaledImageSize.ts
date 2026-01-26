import { Dimensions } from 'react-native';

/**
 * 이미지 원본 비율 기반으로 화면 너비에 맞게 width, height 계산
 * @param originalWidth 원본 이미지의 width (px)
 * @param originalHeight 원본 이미지의 height (px)
 * @returns { width, height } - 화면 너비에 맞춘 사이즈
 */
export const getScaledImageSize = (
  originalWidth: number,
  originalHeight: number,
): { width: number; height: number } => {
  const screenWidth = Dimensions.get('window').width;
  const scale = screenWidth / originalWidth;

  return {
    width: screenWidth,
    height: originalHeight * scale,
  };
};
