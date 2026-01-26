import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconFile from '@/assets/icons/IconFile.svg';
import IconVideo from '@/assets/icons/IconVideo.svg';
import IconVolume from '@/assets/icons/IconVolume.svg';
import PhotoGrid from '@/components/chat/PhotoGrid';
import { getFileCategory, getFileTypeLabel } from '@/utils/chatHelpers';

type MessageUser = 'me' | 'you';

type FileType = 'image' | 'video' | 'other';
export type PhotoItem = { url?: string; thumb?: string };

interface ChatFileBubbleProps {
  user: MessageUser;
  profile?: string;
  file: FileType;
  time?: string;
  read?: boolean;
  thumbnail?: string;
  videoUrl?: string;
  fileUrl?: string;
  mime?: string;
  photoItems?: PhotoItem[];
  uploading?: boolean;
  name?: string;
  sizeLabel?: string;
  onOpenImage?: (startIndex: number, images: string[]) => void;
  onOpenVideo?: (uri: string, thumb?: string) => void;
  onOpenFile?: (url: string, name?: string, mime?: string) => void;
}

function ChatFileBubble({
  user,
  profile,
  file,
  time,
  read,
  thumbnail,
  videoUrl,
  fileUrl,
  mime,
  photoItems,
  uploading,
  name,
  sizeLabel,
  onOpenImage,
  onOpenVideo,
  onOpenFile,
}: ChatFileBubbleProps) {
  const isPhotoGroup = file === 'image' && Array.isArray(photoItems) && photoItems.length > 1;

  return (
    <View style={[styles.container, { flexDirection: user === 'me' ? 'row' : 'row-reverse' }]}>
      <View style={styles.timeWrapper}>
        {user === 'me' && read && (
          <IconCheck
            width={16}
            height={16}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        )}
        <Text style={styles.timeText}>{time}</Text>
      </View>

      <View style={styles.messageWrapper}>
        {file === 'image' ? (
          isPhotoGroup ? (
            <PhotoGrid
              items={photoItems!}
              uploading={!!uploading}
              size={160}
              onPress={(startIndex, images) => onOpenImage?.(startIndex, images)}
            />
          ) : (
            <Pressable
              style={styles.mediaBox}
              onPress={() => {
                if (thumbnail) onOpenImage?.(0, [thumbnail]);
              }}>
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.mediaImage} resizeMode="cover" />
              ) : (
                <View style={styles.mediaPlaceholder} />
              )}
              {uploading && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>전송 중</Text>
                </View>
              )}
            </Pressable>
          )
        ) : (
          (() => {
            const cat = getFileCategory(mime, name, fileUrl, file === 'video' ? 'video' : undefined);
            const extLabel = getFileTypeLabel(mime, name, fileUrl);
            const IconComp = cat === 'video' ? IconVideo : cat === 'audio' ? IconVolume : IconFile;

            const onPress =
              cat === 'video'
                ? () => {
                    const u = videoUrl || fileUrl || thumbnail;
                    if (u) onOpenVideo?.(u, thumbnail);
                  }
                : () => {
                    if (fileUrl) onOpenFile?.(fileUrl, name, mime);
                  };

            return (
              <Pressable style={styles.fileRow} onPress={onPress}>
                <View style={styles.fileIconWrap}>
                  <IconComp
                    width={20}
                    height={20}
                    stroke={semanticColor.icon.primaryOnDark}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                </View>
                <View style={styles.fileTexts}>
                  <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
                    {name}
                  </Text>
                  <View style={styles.fileSizeAndType}>
                    <Text style={styles.fileSize}>{sizeLabel}</Text>
                    <Text style={styles.fileType}>{extLabel}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })()
        )}
      </View>

      {user === 'you' && (
        <View style={styles.imageWrapper}>
          {time ? <Image source={{ uri: profile }} style={styles.image} /> : <View style={{ width: 32, height: 32 }} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[8],
    justifyContent: 'flex-end',
    gap: semanticNumber.spacing[8],
  },
  imageWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: semanticNumber.borderRadius.full,
  },
  timeWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  timeText: {
    ...semanticFont.caption.small,
    color: semanticColor.text.lightest,
  },
  messageWrapper: {
    borderRadius: semanticNumber.borderRadius.xl,
    overflow: 'hidden',
  },
  mediaBox: {
    width: 162,
    height: 162,
    borderRadius: semanticNumber.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    flex: 1,
    backgroundColor: semanticColor.surface.lightGray,
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
  fileRow: {
    width: 240,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[8],
    backgroundColor: semanticColor.surface.gray,
  },
  fileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: semanticNumber.borderRadius.md,
    backgroundColor: semanticColor.surface.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTexts: {
    flex: 1,
  },
  fileName: {
    ...semanticFont.body.large,
    color: semanticColor.text.primary,
  },
  fileSizeAndType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fileSize: {
    ...semanticFont.caption.large,
    color: semanticColor.text.secondary,
  },
  fileType: {
    ...semanticFont.caption.medium,
    color: semanticColor.text.lightest,
  },
});

export default ChatFileBubble;
