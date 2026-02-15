import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Button,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import Icon from 'react-native-vector-icons/Octicons';
import Icon2 from 'react-native-vector-icons/AntDesign';
import useStock from '@/hooks/queries/useStock';
import {useSignupStore} from '@/stores/useAuthStore';
import usePig from '@/hooks/queries/usePig';
import {MyStock, ResponseMyStock} from '@/api/stock';
import {useErrorStore} from '@/stores/errorMessagesStore';
import {useFocusEffect} from '@react-navigation/native';
import useSving from '@/hooks/queries/useSaving';
export default function InvestmentHomeScreen({navigation}: any) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);
  const {useGetMyStock, useGetStockList} = useStock();
  const {useGetMySaving, useGetSavingsDetail} = useSving();
  const {id} = useSignupStore();
  const {getMyCoinMutation} = usePig();
  const money = getMyCoinMutation.data?.coin;
  const {data: myStockData, refetch: myStockRefetch} = useGetMyStock(id);
  const {data: stockListData, refetch: stockListRefetch} = useGetStockList();
  const {data: mySavings, refetch: mySavingsRefetch} = useGetMySaving(); // 적금 상태 조회
  const {data: savingsDetail, refetch: savingsDetailRefetch} = useGetSavingsDetail(id); // 적금 상세 정보 조회

  useFocusEffect(
    useCallback(() => {
      myStockRefetch();
      stockListRefetch();
      mySavingsRefetch();
      savingsDetailRefetch();
    }, [myStockRefetch, stockListRefetch,mySavingsRefetch, savingsDetailRefetch]),
  );

  const stockPrices = useMemo(() => {
    if (stockListData && stockListData.stocks) {
      return stockListData.stocks.map(stock => ({
        stockId: stock.stockId,
        stockPrice: stock.stockPrice,
      }));
    }
    return [];
  }, [stockListData]);

  const stockData = useMemo(() => {
    if (
      myStockData &&
      Array.isArray(myStockData.myStocks) &&
      stockPrices.length > 0
    ) {
      return myStockData.myStocks.map(item => {
        const currentPrice =
          stockPrices.find(sp => sp.stockId === item.stockId)?.stockPrice || 0;
        const profitRate =
          ((currentPrice - item.averagePrice) / item.averagePrice) * 100;
        return {
          stockId: item.stockId,
          name: item.stockName,
          currentPrice: currentPrice,
          averagePrice: item.averagePrice,
          quantity: item.amount, // 보유 수량 추가
          profiteRate: profitRate.toFixed(2) + '%',
        };
      });
    }
    return [];
  }, [myStockData, stockPrices]);

  const totalProfit = useMemo(() => {
    if (stockData.length > 0) {
      const totalInvestment = stockData.reduce(
        (sum, stock) => sum + stock.averagePrice,
        0,
      );
      const totalCurrentValue = stockData.reduce(
        (sum, stock) => sum + stock.currentPrice,
        0,
      );
      const profitAmount = totalCurrentValue - totalInvestment;
      const profitRate = (profitAmount / totalInvestment) * 100;
      return {
        amount: profitAmount.toFixed(0),
        rate: profitRate.toFixed(2) + '%',
      };
    }
    return {amount: '0', rate: '0%'};
  }, [stockData]);

  const goldData = useMemo(() => {
    const goldStock = myStockData?.myStocks.find(stock => stock.stockId === 5);
    const currentGoldPrice =
      stockPrices.find(sp => sp.stockId === 5)?.stockPrice || 0;

    if (goldStock) {
      const profitRate =
        ((currentGoldPrice - goldStock.averagePrice) / goldStock.averagePrice) *
        100;
      return {
        name: '금',
        currentPrice: currentGoldPrice,
        averagePrice: goldStock.averagePrice,
        quantity: goldStock.amount,
        profitRate: profitRate.toFixed(2) + '%',
      };
    }
    return null;
  }, [myStockData, stockPrices]);

  return (
    <SafeAreaView style={{flex:1,backgroundColor:colors.WHITE}}>
      <ScrollView
        // 스크롤뷰 내용물 안가리게 만들기
        contentContainerStyle={{
          flexGrow: 1,
          padding: 30,
          width: '100%',
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View>
          <View style={styles.menuContainer}>
            <View style={styles.assetHeaderContainer}>
              <View style={styles.assetInnerHeaderContainer}>
                <Text style={styles.headerText}>전체 순자산</Text>
                <View style={styles.notification}>
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.notificationText}>
                      {' '}
                      <Icon name="bell-fill" size={15} color="black" /> 투자
                      알림
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.assetInfoContainer}>
              <View style={styles.assetTextConainer}>
                <Text style={styles.assetAmount}>
                  {money?.toLocaleString()}머니
                </Text>
                <View style={styles.profitSection}>
                  <Text style={styles.profitText}>수익률 변동</Text>
                  <Text
                    style={[
                      styles.profitAmount,
                      parseFloat(totalProfit.rate) > 0
                        ? styles.revenueText
                        : parseFloat(totalProfit.rate) < 0
                        ? styles.lossText
                        : styles.neutralText,
                    ]}>
                    {parseFloat(totalProfit.amount) > 0
                      ? '▲'
                      : parseFloat(totalProfit.amount) < 0
                      ? '▼'
                      : ''}{' '}
                    {Math.abs(parseInt(totalProfit.amount))}머니 (
                    {totalProfit.rate})
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{width: '100%'}}>
            {/* 안전자산버튼 */}
            <TouchableOpacity>
              <Pressable
                style={styles.safeAssetHeaderContainer}
                onPress={() =>
                  navigation.navigate('Detail', {selectedAsset: '안전자산'})
                }>
                <Text style={styles.safeAssetHeaderText}>
                  안전 자산 <Icon2 name="right" size={15} color="black" />
                </Text>
              </Pressable>
            </TouchableOpacity>

          {mySavings?.exists ? (
            savingsDetail ? (
              <View style={styles.statusContainer}>
                <View style={styles.titleCell}>
                  <Text style={styles.titleText}>적금 현황</Text>
                </View>
                <View>
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.borderTop, styles.borderBottom]}>
                      <Text style={styles.text}>납부 현황</Text>
                    </View>
                    <View
                      style={[
                        styles.cell,
                        styles.borderTop,
                        styles.borderRight,
                        styles.borderBottom,
                      ]}>
                      <Text style={styles.text}>
                        {savingsDetail?.currentPaidAmount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.cell, styles.borderTop, styles.borderBottom]}>
                      <Text style={styles.smallText}>만기 환급액</Text>
                      <Text style={styles.smallText}>/만기 예상수익</Text>
                    </View>
                    <View style={[styles.cell, styles.borderTop, styles.borderBottom]}>
                      <Text style={styles.smallText}>
                        {savingsDetail?.expectedMaturityAmount.toLocaleString()}
                      </Text>
                      <Text style={styles.smallText}>
                        /{savingsDetail?.expectedMaturityProfit.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.cell, styles.bottomLeftRadiusCell]}>
                      <Text style={styles.text}>월 납입액</Text>
                    </View>
                    <View style={[styles.cell, styles.borderRight]}>
                      <Text style={styles.text}>
                        {savingsDetail?.monthlyDeposit.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.cell}>
                      <Text style={styles.smallText}>다음 납기일</Text>
                      <Text style={styles.smallText}>/만기일</Text>
                    </View>
                    <View style={[styles.cell, styles.bottomRightRadiusCell]}>
                      <Text style={styles.smallText}>
                        {savingsDetail?.nextPaymentDue}
                      </Text>
                      <Text style={styles.smallText}>
                        /{savingsDetail?.maturityDate}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <Text>적금 상세 정보를 불러오는 중...</Text>
            )
          ) :  <View style={[styles.row, styles.emptyStateRow]}>
                <Text style={styles.emptyStateText}>
                  보유하고 있는 적금이 없습니다.
                </Text>
              </View>}


         
          {/* 위험 자산 버튼 */}
          <TouchableOpacity style={{marginTop: 20}}>
            <Pressable
              style={styles.safeAssetHeaderContainer}
              onPress={() =>
                navigation.navigate('Detail', {selectedAsset: '실물자산'})
              }>
              <Text style={styles.safeAssetHeaderText}>
                실물 자산 <Icon2 name="right" size={15} color="black" />
              </Text>
            </Pressable>
          </TouchableOpacity>

            {/* 금 수익 현황 */}
            {goldData ? (
              <View style={styles.statusContainer}>
                <View style={styles.titleCell}>
                  <Text style={styles.titleText}>금 수익 현황</Text>
                </View>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.cell,
                      styles.borderTop,
                      styles.borderBottom,
                    ]}>
                    <Text style={styles.text}>원화{'\n'}매입금액</Text>
                  </View>
                  <View
                    style={[
                      styles.cell,
                      styles.borderTop,
                      styles.borderBottom,
                      styles.borderRight,
                    ]}>
                    <Text style={styles.text}>
                      {goldData.averagePrice.toLocaleString()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.borderTop,
                      styles.borderBottom,
                    ]}>
                    <Text style={styles.text}>보유{'\n'}수량</Text>
                  </View>
                  <View
                    style={[
                      styles.cell,
                      styles.borderTop,
                      styles.borderRight,
                      styles.borderBottom,
                    ]}>
                    <Text style={styles.text}>{goldData.quantity}</Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      styles.borderTop,
                      styles.borderBottom,
                    ]}>
                    <Text style={styles.text}>수익률(%)</Text>
                  </View>
                  <View
                    style={[
                      styles.cell,
                      styles.borderTop,
                      styles.borderBottom,
                    ]}>
                    <Text
                      style={[
                        styles.text,
                        parseFloat(goldData.profitRate) > 0
                          ? styles.revenueText
                          : parseFloat(goldData.profitRate) < 0
                          ? styles.lossText
                          : styles.neutralText,
                      ]}>
                      {goldData.profitRate}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.row, styles.emptyStateRow]}>
                <Text style={styles.emptyStateText}>
                  보유하고 있는 금이 없습니다.
                </Text>
              </View>
            )}
          </View>
          <View style={{width: '100%'}}>
            {/* 위험 자산 버튼 */}
            <TouchableOpacity style={{marginTop: 20}}>
              <Pressable
                style={styles.safeAssetHeaderContainer}
                onPress={() =>
                  navigation.navigate('Detail', {selectedAsset: '위험자산'})
                }>
                <Text style={styles.safeAssetHeaderText}>
                  위험 자산 <Icon2 name="right" size={15} color="black" />
                </Text>
              </Pressable>
            </TouchableOpacity>

            {/* 주식 수익 현황 */}
            {/* <View style={styles.statusContainer}>
            <View style={styles.titleCell}>
              <Text style={styles.titleText}>주식 수익 현황</Text>
            </View>
            <View style={styles.row}>
              <View
                style={[styles.cell, styles.borderTop, styles.borderBottom]}>
                <Text style={styles.text}>원화매입금액</Text>
              </View>
              <View
                style={[
                  styles.cell,
                  styles.borderTop,
                  styles.borderBottom,
                  styles.borderRight,
                ]}>
                <Text style={styles.text}>10,000</Text>
              </View>
              <View
                style={[styles.cell, styles.borderTop, styles.borderBottom]}>
                <Text style={styles.text}>원화평가손익</Text>
              </View>
              <View
                style={[styles.cell, styles.borderTop, styles.borderBottom]}>
                <Text style={[styles.text, styles.redText]}>1,500</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.cell, styles.bottomLeftRadiusCell]}>
                <Text style={styles.text}>원화평가금액</Text>
              </View>
              <View style={[styles.cell, styles.borderRight]}>
                <Text style={styles.text}>3,000</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.text}>수익률(%)</Text>
              </View>
              <View style={[styles.cell, styles.bottomRightRadiusCell]}>
                <Text style={[styles.text, styles.redText]}>3,000</Text>
              </View>
            </View>
          </View> */}

            {/* 보유 주식 현황 */}
            <View style={styles.statusContainer}>
              <View style={styles.titleCell}>
                <Text style={styles.titleText}>보유 주식 현황</Text>
              </View>
              <View style={styles.row}>
                <View
                  style={[
                    styles.cell,
                    styles.borderTop,
                    styles.borderRight,
                    styles.yellow,
                    {flex: 1},
                  ]}>
                  <Text style={styles.unSafeTitleText}>종목명</Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.borderTop,
                    styles.borderRight,
                    styles.yellow,
                    {flex: 1},
                  ]}>
                  <Text style={styles.unSafeTitleText}>매입단가</Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.borderTop,
                    styles.borderRight,
                    styles.yellow,
                    {flex: 1},
                  ]}>
                  <Text style={styles.unSafeTitleText}>보유수량</Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.borderTop,
                    styles.yellow,
                    {flex: 1},
                  ]}>
                  <Text style={styles.unSafeTitleText}>수익률</Text>
                </View>
              </View>

              {/* 보유 주식 데이터 목록 */}
              {stockData
                .filter(stock => stock.stockId !== 5) // 금(stockId: 5)을 제외
                .map((stock, index, filteredArray) => (
                  <View key={index} style={styles.row}>
                    <View
                      style={[
                        styles.cell,
                        styles.borderTop,
                        styles.borderRight,
                        {flex: 1},
                        index === filteredArray.length - 1
                          ? styles.bottomLeftRadiusCell
                          : null,
                      ]}>
                      <Text style={styles.unSafeText}>{stock.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.cell,
                        styles.borderTop,
                        styles.borderRight,
                        {flex: 1},
                      ]}>
                      <Text style={styles.unSafeText}>
                        {stock.currentPrice.toLocaleString()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.cell,
                        styles.borderTop,
                        styles.borderRight,
                        {flex: 1},
                      ]}>
                      <Text style={styles.unSafeText}>{stock.quantity}</Text>
                    </View>
                    <View
                      style={[
                        styles.cell,
                        styles.borderTop,
                        {flex: 1},
                        index === filteredArray.length - 1
                          ? styles.bottomRightRadiusCell
                          : null,
                      ]}>
                      <Text
                        style={[
                          styles.unSafeText,
                          parseFloat(stock.profiteRate) > 0
                            ? styles.revenueText
                            : parseFloat(stock.profiteRate) < 0
                            ? styles.lossText
                            : styles.neutralText,
                        ]}>
                        {stock.profiteRate}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    backgroundColor: colors.YELLOW_25,
    borderRadius: 10,
    borderColor: '#FFE37F',
    borderWidth: 1,
    width: '100%',
    marginTop: 10,
  },
  titleText: {
    fontSize: 16,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    marginLeft: 15,
  },
  row: {
    flexDirection: 'row',
  },
  titleCell: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    height: 50,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    borderColor: colors.YELLOW_50,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  borderTop: {
    borderTopWidth: 1,
  },
  borderRight: {
    borderRightWidth: 1,
  },
  yellow: {
    backgroundColor: colors.YELLOW_25,
  },
  text: {
    lineHeight:10,
    fontSize: 10,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  smallText: {
    fontSize: 8,
    lineHeight:10,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1, // 테두리 두께
    borderColor: colors.BLACK,
  },
  savingsStatusInnerConainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.BLACK,
  },
  savingsStatusConainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  safeAssetHeaderContainer: {
    width: '100%',
    marginLeft: 5,
  },
  safeAssetHeaderText: {
    fontSize: 20,
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
  },
  unSafeTitleText: {
    fontSize: 14,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  assetInnerHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetHeaderContainer: {
    width: '100%',
    height: 40,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  headerText: {
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
    fontSize: 20,
    marginLeft: 10,
    marginTop: 5,
  },
  unSafeText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 15,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    marginLeft: 5,
    fontSize: 14,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  assetInfoContainer: {
    backgroundColor: colors.WHITE,
    height: 69,
    width: '90%',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetTextConainer: {
    flexDirection: 'row', // 가로 정렬
    justifyContent: 'center',
  },
  assetAmount: {
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
    fontSize: 20,
  },
  profitSection: {
    flexDirection: 'column', // 세로 정렬
    alignItems: 'flex-start', // 왼쪽 정렬
    marginLeft: 15,
  },
  profitChange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 10,
  },
  profitAmount: {
    fontSize: 10,
    fontFamily: fonts.MEDIUM,
    color: 'red', // 빨간색 텍스트
  },
  container: {
    padding: 20,
    // alignItems: 'center',
    backgroundColor: colors.WHITE,
    // width: '100%',
  },
  menuContainer: {
    backgroundColor: colors.YELLOW_100,
    width: '100%',
    height: 130,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  bottomLeftRadiusCell: {
    borderBottomLeftRadius: 10, // 왼쪽 아래 둥글게
  },
  bottomRightRadiusCell: {
    borderBottomRightRadius: 10, // 오른쪽 아래 둥글게
  },
  redText: {
    color: colors.RED_100,
  },
  revenueText: {
    color: colors.RED_100,
  },
  lossText: {
    color: colors.BLUE_100,
  },
  neutralText: {
    color: colors.BLACK,
  },
  emptyStateRow: {
    flex: 1,
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    color: colors.GRAY_75,
    fontFamily: fonts.MEDIUM,
    fontSize: 14,
  },
});
