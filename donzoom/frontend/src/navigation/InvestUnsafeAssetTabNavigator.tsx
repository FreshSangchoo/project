import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import UnsafeChartTabScreen from '@/views/screens/investment/UnsafeAssetTabScreen/UnsafeAssetChartTabScreen';
import UnsafeNewsTabScreen from '@/views/screens/investment/UnsafeAssetTabScreen/UnsafeAssetNewsTabScreen';
import UnsafeReportTabScreen from '@/views/screens/investment/UnsafeAssetTabScreen/UnsafeAssetReportTabScreen';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import {StyleSheet} from 'react-native';

const InvestUnsafeAssetTabNavigator = ({
  selectedStock,
  selectedStockIndex,
}: any) => {
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
        options={{
          tabBarLabel: '차트',
        }}>
        {props => (
          <UnsafeChartTabScreen
            {...props}
            selectedStock={selectedStock}
            selectedStockIndex={selectedStockIndex}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="뉴스">
        {props => (
          <UnsafeNewsTabScreen
            {...props}
            selectedStock={selectedStock}
            selectedStockIndex={selectedStockIndex}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="리포트">
        {props => (
          <UnsafeReportTabScreen
            {...props}
            selectedStock={selectedStock}
            selectedStockIndex={selectedStockIndex}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default InvestUnsafeAssetTabNavigator;

const styles = StyleSheet.create({
  tabNavigator: {
    flex: 1,
    height: 1000,
    backgroundColor: colors.BLACK,
  },
});
