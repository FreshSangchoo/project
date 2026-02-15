import React, {useCallback, useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import useStock from '@/hooks/queries/useStock';
import useWebSocket from '@/hooks/useWebSocket';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import InvestRealAssetTabNavigator from '@/navigation/InvestRealAssetTabNavigator';

type WebSocketMessage = {
  id: number;
  stock: {
    id: number;
    stockName: string;
  };
  open: number;
  close: number;
  high: number;
  low: number;
  createdAt: string;
  updatedAt: string | null;
};

export default function RealAssetDetailScreen({navigation}: any) {
  const [selectedStock, setSelectedStock] = useState<string>('금');
  const [realAssetMoney, setRealAssetMoney] = useState<number>(0);
  const [realAssetDollar, setRealAssetDollar] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {useGetStock} = useStock();
  const {data: stockData, isLoading, error} = useGetStock(5, 'day');

  const animateValue = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (
      stockData &&
      stockData.stockHistories &&
      stockData.stockHistories.length > 0
    ) {
      setRealAssetMoney(
        stockData.stockHistories[stockData.stockHistories.length - 1].open,
      );
      animateValue();
    }
  }, [stockData]);

  useWebSocket([5], (message: string) => {
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message);
      setRealAssetMoney(parsedMessage.close);
      animateValue();
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  useEffect(() => {
    setRealAssetDollar(Math.floor(realAssetMoney * 0.12));
  }, [realAssetMoney]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.assetTitle}>{selectedStock}</Text>
        </View>
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            opacity: fadeAnim,
          }}>
          <Text style={styles.moneyTitle}>
            {realAssetMoney.toLocaleString()}머니
          </Text>
          <Text style={styles.dollarTitle}>${realAssetDollar} 달러 </Text>
        </Animated.View>
      </View>
      <InvestRealAssetTabNavigator />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    justifyContent: 'flex-start',
    padding: 15,
  },
  tabNavigator: {
    flex: 1,
    height: 1000,
    backgroundColor: colors.BLACK,
  },
  assetTitle: {
    fontSize: 23,
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
  },
  moneyTitle: {
    fontSize: 25,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
  },
  dollarTitle: {
    marginLeft: 10,
    marginTop: 10,
    fontSize: 12,
    color: colors.BLACK,
    fontFamily: fonts.LIGHT,
  },
});
