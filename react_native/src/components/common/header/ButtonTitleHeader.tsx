import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { HeaderProps } from '@/types/headers';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';

function ButtonTitleHeader({ title, leftChilds, rightChilds = [] }: HeaderProps) {
  return (
    <View style={styles.buttonTitleHeader}>
      <TouchableOpacity style={styles.leftChildWrapper} onPress={leftChilds?.onPress}>
        {leftChilds?.icon}
      </TouchableOpacity>
      <Text style={styles.titleWrapper} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      <View style={styles.rightButtonsWrapper}>
        {rightChilds.map((button, idx) => (
          <TouchableOpacity key={idx} style={styles.rightButton} onPress={button.onPress}>
            {button.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonTitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[2],
    height: 48,
  },
  titleWrapper: {
    flex: 1,
    color: semanticColor.text.primary,
    ...semanticFont.title.medium,
  },
  leftChildWrapper: {
    width: 44,
    height: 44,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  rightButtonsWrapper: {
    flexDirection: 'row',
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

export default ButtonTitleHeader;
