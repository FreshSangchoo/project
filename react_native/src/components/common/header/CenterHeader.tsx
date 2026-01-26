import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HeaderProps } from '@/types/headers';
import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';

function CenterHeader({ title, leftChilds, rightChilds = [] }: HeaderProps) {
  return (
    <View style={styles.centerHeader}>
      <TouchableOpacity style={styles.leftChildWrapper} onPress={leftChilds?.onPress}>
        {leftChilds?.icon}
      </TouchableOpacity>
      <Text style={styles.titleText}>{title}</Text>
      <View style={styles.rightChildWrapper}>
        {rightChilds?.map((child, idx) => (
          <TouchableOpacity key={idx} onPress={child?.onPress}>
            {child?.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    height: 48,
    backgroundColor: semanticColor.surface.white,
  },
  titleText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.XL,
    lineHeight: fonts.lineHeight.XL,
    letterSpacing: fonts.letterSpacing.none,
  },
  leftChildWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rightChildWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
});

export default CenterHeader;
