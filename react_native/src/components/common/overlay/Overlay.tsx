import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';

interface OverlayProps {
  visible: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  isBottomSheet?: boolean;
}

const Overlay = ({ visible, onClose, children, isBottomSheet }: OverlayProps) => {
  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      {isBottomSheet ? (
        <Pressable style={styles.bottomSheetContainer} onPress={onClose}>
          <Pressable style={styles.inner} onPress={e => e.stopPropagation()}>
            {children}
          </Pressable>
        </Pressable>
      ) : (
        <Pressable style={styles.container} onPress={onClose}>
          <Pressable style={styles.inner} onPress={e => e.stopPropagation()}>
            {children}
          </Pressable>
        </Pressable>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.overlay.black25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: semanticColor.overlay.black25,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  inner: {
    width: '100%',
  },
});

export default Overlay;
