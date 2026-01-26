import { Platform, StyleSheet, Text } from 'react-native';
import IconHomeFilled from '@assets/icons/IconHomeFilled.svg';
import IconCompassFilled from '@assets/icons/IconCompassFilled.svg';
import IconMessageCircleFilled from '@assets/icons/IconMessageCircleFilled.svg';
import IconUserFilled from '@assets/icons/IconUserFilled.svg';
import { semanticColor } from '@/styles/semantic-color';
import { SvgProps } from 'react-native-svg';
import { semanticNumber } from '@/styles/semantic-number';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '@/navigation/types/tabs';
import { semanticFont } from '@/styles/semantic-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Home from '@/pages/home/Home';
import ExplorePage from '@/pages/explore/ExplorePage';
import ChattingIndexPage from '@/pages/chat/ChattingIndexPage';
import MyPage from '@/pages/my-page/MyPage';

type TabType = 'Home' | 'Explore' | 'Chat' | 'My';

const tabs: { key: TabType; label: string; Icon: React.FC<SvgProps> }[] = [
  { key: 'Home', label: '홈', Icon: IconHomeFilled },
  { key: 'Explore', label: '둘러보기', Icon: IconCompassFilled },
  { key: 'Chat', label: '채팅', Icon: IconMessageCircleFilled },
  { key: 'My', label: '마이', Icon: IconUserFilled },
];

const Tab = createBottomTabNavigator<TabParamList>();

function NavBar() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const isAndroid = Platform.OS === 'android';

        return {
          headerShown: false,
          tabBarStyle: {
            height: isAndroid ? 78 + insets.bottom : 49 + insets.bottom,
            paddingHorizontal: semanticNumber.spacing[16],
            paddingTop: isAndroid ? 9 : 0,
            paddingBottom: isAndroid ? 9 + insets.bottom : insets.bottom,
            borderTopWidth: semanticNumber.stroke.hairline,
            borderTopColor: semanticColor.border.medium,
            backgroundColor: semanticColor.surface.white,
          },
          tabBarIcon: ({ focused }) => {
            const Icon = tabs.find(tab => tab.key === route.name)!.Icon;
            const iconColor = focused ? semanticColor.icon.primary : semanticColor.icon.lightest;

            return <Icon fill={iconColor} color={iconColor} stroke={iconColor} />;
          },
          tabBarActiveTintColor: semanticColor.text.primary,
          tabBarInactiveTintColor: semanticColor.text.lightest,
          tabBarLabel: ({ color }) => {
            const label = tabs.find(tab => tab.key === route.name)!.label;
            return <Text style={[styles.text, { color }]}>{label}</Text>;
          },
        };
      }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Explore" component={ExplorePage} />
      <Tab.Screen name="Chat" component={ChattingIndexPage} />
      <Tab.Screen name="My" component={MyPage} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  text: {
    ...semanticFont.label.xxxsmall,
    color: semanticColor.text.lightest,
  },
});

export default NavBar;
