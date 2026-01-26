import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';

const BottomSheetTabBar = ({ state, descriptors, navigation }: MaterialTopTabBarProps) => {
  return (
    <View style={styles.container}>
      <ScrollView
        nestedScrollEnabled={true}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.wrapper}>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomColor: semanticColor.border.medium,
    borderBottomWidth: semanticNumber.stroke.xlight,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    height: 44,
    paddingHorizontal: semanticNumber.spacing[16],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: semanticColor.text.secondary,
    ...semanticFont.body.large,
  },
});

export default BottomSheetTabBar;
