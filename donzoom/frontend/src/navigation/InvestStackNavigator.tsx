import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {fonts} from '@/constants/font';
import DetailScreen from '@/views/screens/investment/DetailScreen';
import InvestmentHomeScreen from '@/views/screens/investment/InvestmentHomeScreen';
import RealAssetDetailScreen from '@/views/screens/investment/RealAssetScreen/RealAssetDetailScreen';
import UnsafeAssetDetailScreen from '@/views/screens/investment/UnsafeAssetScreen/UnsafeAssetDetailScreen';
import SafeAssetDetailScreen from '@/views/screens/investment/SafeAssetDetailScreen';
import InvestTradeScreen from '@/views/screens/investment/InvestTradeScreen';
import InvestTabNavigator from './InvestRealAssetTabNavigator';
import RealAssetPastReportScreen from '@/views/screens/investment/RealAssetScreen/RealAssetPastReportScreen';
import RealAssetPastNewsScreen from '@/views/screens/investment/RealAssetScreen/RealAssetPastNewsScreen';
import UnsafeAssetPastNewsScreen from '@/views/screens/investment/UnsafeAssetScreen/UnsafeAssetPastNewsScreen';
import UnsafeAssetPastReportScreen from '@/views/screens/investment/UnsafeAssetScreen/UnsafeAssetPastReportScreen';
import NewDetailScreen from '@/views/screens/investment/NewsDetailScreen';
import ReportDetailScreen from '@/views/screens/investment/ReportDetailScreen';

const Stack = createNativeStackNavigator();

const InvestStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        title: '모의 투자',
        headerTitleStyle: {
          fontFamily: fonts.MEDIUM,
          fontWeight: '500',
          fontSize: 20,
        },
        headerTitleAlign: 'center', // 헤더 제목 정렬
      }}>
      <Stack.Screen name="Home" component={InvestmentHomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="Safe" component={SafeAssetDetailScreen} />
      <Stack.Screen
        name="Real"
        component={RealAssetDetailScreen}
        initialParams={{selectedAssetType: 'Real'}}
      />
      <Stack.Screen
        name="Unsafe"
        component={UnsafeAssetDetailScreen}
        initialParams={{selectedAssetType: 'Unsafe'}}
      />

      <Stack.Screen name="InvestTab" component={InvestTabNavigator} />
      <Stack.Screen name="Trade" component={InvestTradeScreen} />
      <Stack.Screen
        name="RealAssetPastNews"
        component={RealAssetPastNewsScreen}
        options={{title: '금 현물 뉴스'}}
      />
      <Stack.Screen
        name="RealAssetPastReport"
        component={RealAssetPastReportScreen}
        options={{title: '금 현물 리포트'}}
      />
      <Stack.Screen
        name="NewsDetail"
        component={NewDetailScreen}
        options={{title: '뉴스 상세'}}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{title: '리포트 상세'}}
      />
      <Stack.Screen
        name="UnsafeAssetPastNews"
        component={UnsafeAssetPastNewsScreen}
        options={{title: '뉴스'}}
      />
      <Stack.Screen
        name="UnsafeAssetPastReport"
        component={UnsafeAssetPastReportScreen}
        options={{title: '리포트'}}
      />
    </Stack.Navigator>
  );
};
export default InvestStackNavigator;
