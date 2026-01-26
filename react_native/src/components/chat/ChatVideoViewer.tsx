import { Modal, View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconX from '@/assets/icons/IconX.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { useState } from 'react';

type VideoViewerProps = {
  visible: boolean;
  uri?: string;
  thumb?: string;
  onClose: () => void;
};

export default function VideoViewer({ visible, uri, thumb, onClose }: VideoViewerProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  return (
    <Modal visible={visible} onRequestClose={onClose} presentationStyle="overFullScreen" animationType="fade">
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 10 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconTouch} onPress={onClose}>
            <IconX
              width={28}
              height={28}
              stroke={semanticColor.icon.primaryOnDark}
              strokeWidth={semanticNumber.stroke.bold}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.playerWrap}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator />
            </View>
          )}
          {uri ? (
            <Video
              source={{ uri }}
              style={styles.video}
              controls
              paused={false}
              resizeMode="contain"
              poster={thumb}
              posterResizeMode="cover"
              onLoadStart={() => setLoading(true)}
              onReadyForDisplay={() => setLoading(false)}
              onError={e => {
                setLoading(false);
                if (__DEV__) {
                  console.log('[VideoViewer] error', e);
                }
              }}
              ignoreSilentSwitch="obey"
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.dark,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
  },
  iconTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    paddingRight: semanticNumber.spacing[6],
  },
  playerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
