import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';

const TabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => {
  const count = state.routes.length;
  const basis = 100 / count;
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {state.routes.map((route: any, index: number) => {
          const label = route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              style={[
                styles.tabButton,
                { width: `${basis}%` },
                isFocused && {
                  borderBottomColor: semanticColor.border.dark,
                  borderBottomWidth: semanticNumber.stroke.bold,
                },
              ]}
              onPress={onPress}
              key={`tab_${index}`}>
              <Text
                style={[
                  styles.tabText,
                  isFocused && {
                    color: semanticColor.text.primary,
                    ...semanticFont.body.largeStrong,
                  },
                ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  wrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    height: 44,
    paddingHorizontal: semanticNumber.spacing[16],
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: semanticColor.border.medium,
    borderBottomWidth: semanticNumber.stroke.xlight,
  },
  tabText: {
    color: semanticColor.text.secondary,
    ...semanticFont.body.large,
  },
});

export default TabBar;
