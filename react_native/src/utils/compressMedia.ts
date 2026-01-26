import type { Asset } from 'react-native-image-picker';
import { Image as ImgCompressor, Video as VidCompressor } from 'react-native-compressor';

export type CompressedFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

function guessName(asset: Asset, fallbackExt: string) {
  const raw = asset.fileName || asset.uri?.split('/').pop() || `upload${fallbackExt}`;
  return raw.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
}

export async function compressPickedAsset(asset: Asset): Promise<CompressedFile> {
  const uri = asset.uri!;
  const type = asset.type || (asset.duration ? 'video/mp4' : 'image/jpeg');

  // 동영상
  if (type.startsWith('video/')) {
    const outUri = await VidCompressor.compress(uri, {
      compressionMethod: 'auto',
    });
    return {
      uri: outUri,
      name: guessName(asset, '.mp4'),
      type: 'video/mp4',
    };
  }

  // 이미지
  const outUri = await ImgCompressor.compress(uri, {
    compressionMethod: 'auto',
    quality: 0.7,
    maxWidth: 1280,
    maxHeight: 1280,
  });

  return {
    uri: outUri,
    name: guessName(asset, '.jpg'),
    type: 'image/jpeg',
  };
}
