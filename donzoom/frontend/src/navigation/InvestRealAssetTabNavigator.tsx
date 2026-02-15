import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import RealAssetChartTabScreen from '@/views/screens/investment/RealAssetTabScreen/RealAssetChartTabScreen';
import RealAssetNewsTabScreen from '@/views/screens/investment/RealAssetTabScreen/RealAssetNewsTabScreen';
import RealAssetReportTabScreen from '@/views/screens/investment/RealAssetTabScreen/RealAssetReportTabScreen';

import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

const InvestRealAssetTabNavigator = ({selectedAssetType}: any) => {
  const Tab = createMaterialTopTabNavigator();

  return (
    <Tab.Navigator
      initialRouteName="차트"
      screenOptions={{
        tabBarActiveTintColor: colors.BLACK,
        tabBarLabelStyle: {
          fontFamily: fonts.BOLD,
          fontSize: 16,
        },
        tabBarIndicatorStyle: {backgroundColor: colors.YELLOW_100},
      }}
      style={styles.tabNavigator}>
      <Tab.Screen
        name="차트"
        component={RealAssetChartTabScreen}
        initialParams={{selectedAssetType}}
      />
      <Tab.Screen
        name="뉴스"
        component={RealAssetNewsTabScreen}
        initialParams={{selectedAssetType}}
      />
      <Tab.Screen
        name="리포트"
        component={RealAssetReportTabScreen}
        initialParams={{selectedAssetType}}
      />
    </Tab.Navigator>
  );
};

export default InvestRealAssetTabNavigator;

const styles = StyleSheet.create({
  tabNavigator: {
    flex: 1,
    height: 1000,
    backgroundColor: colors.BLACK,
  },
});
