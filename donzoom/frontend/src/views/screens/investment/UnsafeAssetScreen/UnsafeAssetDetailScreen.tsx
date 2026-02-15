import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import InvestUnsafeAssetTabNavigator from '@/navigation/InvestUnsafeAssetTabNavigator';
import {useFocusEffect} from '@react-navigation/native';
import usePig from '@/hooks/queries/usePig';
import useStock from '@/hooks/queries/useStock';
import useWebSocket from '@/hooks/useWebSocket';

interface Stocks {
  stockId: number;
  stockName: string;
  stockPrice: number;
  lastCreatedAt: string;
}

const stockIndices = {
  삼성전자: 1,
  LG전자: 2,
  네이버: 3,
  카카오: 4,
  Apple: 6,
  Google: 7,
  Tesla: 8,
};

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

const Tab = createMaterialTopTabNavigator();

export default function UnsafeAssetDetailScreen({navigation}: any) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1일'); // 기본 기간 선택
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // 드롭다운 메뉴 표시 상태
  const [selectedStock, setSelectedStock] = useState<string>('삼성전자'); // 기본 종목 선택 상태
  const [realAssetMoney, setRealAssetMoney] = useState<number | undefined>(0); // 현재 보유한 금을 머니로 환산한 값
  const [realAssetDollar, setRealAssetDollar] = useState<number>(0); // 현재 보유한 금을 머니로 환산한 값
  const {getMyCoinMutation} = usePig();
  const {useGetStock, useGetLatestStock} = useStock();

  // 종목 선택 옵션
  const domesticStocks = ['삼성전자', 'LG전자', '네이버', '카카오'];
  const foreignStocks = ['Apple', 'Google', 'Tesla'];

  const getSelectedStockIndex = () => {
    return stockIndices[selectedStock as keyof typeof stockIndices] || 0;
  };

  const [stockMessage, setStockMessage] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  // useWebSocket([getSelectedStockIndex()], (message: string) => {
  //   try {
  //     const parsedMessage: WebSocketMessage = JSON.parse(message);
  //     setRealAssetMoney(parsedMessage.close);
  //     animateValue();
  //   } catch (error) {
  //     console.error('Error parsing WebSocket message:', error);
  //   }
  // });

  useEffect(() => {
    console.log('-------------------------------------------------');
    console.log(stockMessage);
  }, [stockMessage]);
  const {data: stockData, isLoading} = useGetStock(
    getSelectedStockIndex(),
    'min',
  );

  const {data: latestStockData, refetch} = useGetLatestStock(
    getSelectedStockIndex(),
  );

  useEffect(() => {
    console.log('getSelectedStockIndex():', getSelectedStockIndex());
    console.log('latestStockData:', latestStockData);
    setRealAssetMoney(latestStockData?.stockPrice);
  }, [latestStockData]);

  useEffect(() => {
    if (!isLoading && stockData) {
      console.log(
        `Selected stock: ${selectedStock}, Index: ${getSelectedStockIndex()}`,
      );
      const stockprice =
        stockData.stockHistories[stockData.stockHistories.length - 1]?.close;
      setRealAssetMoney(stockprice);
      setRealAssetDollar(
        Number((stockprice ? stockprice / 1200 : 0).toFixed(2)),
      );
      animateValue();
    }
  }, [selectedStock, isLoading]);

  // 종목 선택 시
  const handleStockChange = (stock: string) => {
    setSelectedStock(stock);
    console.log('여기');
    setIsDropdownVisible(false);
  };

  // 드롭다운 버튼 토글
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // 기간 선택 변경
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // 선택된 종목과 기간에 따라 데이터를 렌더링하는 함수
  const renderStockData = () => {
    if (selectedStock === '종목 선택') {
      return <Text>먼저 종목을 선택해주세요.</Text>;
    }

    return (
      <Text>
        {selectedStock}의 {selectedPeriod} 동안의 데이터
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View>
            <Text style={styles.assetTitle}>{selectedStock}</Text>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.moneyTitle}>
                {realAssetMoney?.toLocaleString()}머니
              </Text>
              <Text style={styles.dollarTitle}>${realAssetDollar}달러</Text>
            </View>
          </View>

          {/* 우측 상단 종목 선택 버튼 */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={toggleDropdown}>
              <View style={styles.dropdownButtonContainer}>
                <Text style={styles.dropdownButtonText}>{selectedStock}</Text>
                <Icon
                  name={isDropdownVisible ? 'up' : 'down'}
                  size={15}
                  color="#6B7280"
                  style={styles.dropdownIcon}
                />
              </View>
            </TouchableOpacity>

            {/* 드롭다운 메뉴 */}
            {isDropdownVisible && (
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownSectionTitle}>국내주식</Text>
                <View style={styles.leftBorder}></View>
                {domesticStocks.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => handleStockChange(option)}>
                    <Text
                      style={[
                        styles.dropdownText,
                        selectedStock === option && styles.selectedText,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.dropdownSectionTitle}>해외주식</Text>
                <View style={styles.leftBorder}></View>
                {foreignStocks.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => handleStockChange(option)}>
                    <Text
                      style={[
                        styles.dropdownText,
                        selectedStock === option && styles.selectedText,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
      <InvestUnsafeAssetTabNavigator
        selectedStock={selectedStock}
        selectedStockIndex={getSelectedStockIndex()}
      />
      {/* 선택된 종목과 기간에 따른 데이터 렌더링 */}
      {/* <View style={styles.stockDataContainer}>
        <Text>스톡데이터 컨테이너</Text>
        {renderStockData()}
      </View> */}
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
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownButton: {
    paddingBottom: 5,
  },
  dropdownContainer: {
    position: 'absolute', // 절대 위치를 설정하여 다른 요소 위에 나타남
    top: 20, // 상단에 위치한 버튼으로부터 아래로 약간 떨어짐
    right: 0,
    backgroundColor: colors.WHITE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingLeft: 0,
    width: 90,
    height: 180,
    zIndex: 9999, // 드롭다운이 다른 모든 요소들보다 위에 나타나도록 zIndex를 크게 설정
  },
  dropdownOption: {},
  dropdownText: {
    fontSize: 9,
    fontFamily: fonts.LIGHT,
    lineHeight: 16,
    textAlign: 'right',
  },
  dropdownSectionTitle: {
    fontSize: 12,
    fontFamily: fonts.LIGHT,
    color: colors.BLACK,
    fontWeight: '300',
    paddingVertical: 5,
    marginLeft: 5,
  },
  selectedText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  periodButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    borderColor: '#ccc',
    // borderWidth: 1,
  },
  selectedPeriodButton: {
    backgroundColor: '#FFE999',
    borderColor: '#FFE999',
  },
  selectedPeriodText: {
    color: '#000',
    fontWeight: 'bold',
  },
  unselectedPeriodText: {
    color: '#ccc',
  },
  stockDataContainer: {
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  actionButton: {
    width: 100,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: 'red',
  },
  sellButton: {
    backgroundColor: 'blue',
  },
  dropdownButtonContainer: {
    flexDirection: 'row', // 텍스트와 아이콘을 가로로 정렬
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    textDecorationLine: 'underline', // 텍스트에만 밑줄 적용
  },
  dropdownIcon: {
    marginLeft: 5, // 텍스트와 아이콘 사이에 약간의 간격 추가
  },
  dropdownTitleText: {
    fontFamily: fonts.LIGHT,
    color: '#6B7280',
    fontSize: 15,
  },
  leftBorder: {
    borderTopWidth: 1,
    borderTopColor: '#6B7280',
    marginBottom: 5,
    width: '75%', // 상단 경계선의 길이를 75%로 설정
    // alignSelf: 'left', // 왼쪽 정렬
  },
});
