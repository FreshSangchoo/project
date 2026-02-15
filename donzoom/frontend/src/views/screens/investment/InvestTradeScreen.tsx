import React, {useEffect, useState} from 'react';
import {colors} from '@/constants/colors';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import KeyPad from '@/views/components/KeyPad';
import {fonts} from '@/constants/font';
import useWebSocket from '@/hooks/useWebSocket';
import useStock from '@/hooks/queries/useStock';
import usePig from '@/hooks/queries/usePig';
import {useSignupStore} from '@/stores/useAuthStore';

type MyStock = {
  stockWalletId: number;
  stockId: number;
  stockName: string;
  totalInvestedPrice: number;
  amount: number;
  averagePrice: number;
};

const InvestTradeScreen = ({route, navigation}: any) => {
  const trade = route.params.trade || '';
  const type = route.params.type || '';
  const price = route.params.price || '';
  const selectedStockIndex = route.params.selectedStockIndex || 0;
  const [dollar, setDollar] = useState<number>(119.37);
  const [ableBuyNum, setAbleBuyNum] = useState<number>(0);
  const [ableSellNum, setAbleSellNum] = useState<number>(0);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const {getMyCoinMutation} = usePig();
  const [myMoney, setMyMoney] = useState(0);
  const [stockMessage, setStockMessage] = useState<string>('');
  const {buyStockMutation, useGetMyStockId, sellStockMutation} = useStock();
  const {id} = useSignupStore();
  const [myStocks, setMyStocks] = useState<MyStock[]>([]);

  const {data} = useGetMyStockId(id, selectedStockIndex);

  useEffect(() => {
    if (data && Array.isArray(data.myStocks)) {
      setMyStocks(data.myStocks);
    }
  }, [data]);

  useEffect(() => {
    console.log('내 보유 주식:', myStocks);
    setAbleSellNum(myStocks[0]?.amount);
  }, [myStocks]);

  useEffect(() => {
    const myCoin = getMyCoinMutation?.data ? getMyCoinMutation?.data.coin : 0;
    console.log('myCoin:', myCoin);
    if (myCoin === 0) {
      setAbleBuyNum(0);
    } else {
      setAbleBuyNum(Math.floor(myCoin / price));
    }
    setMyMoney(myCoin);
  }, []);

  // useWebSocket([5], message => {
  //   setStockMessage(message);
  // });

  // console.log(useGetStock(5).data);

  const stockId = String(selectedStockIndex);
  // console.log('selectedStockIndex:', selectedStockIndex);

  const handelBuyStock = () => {
    if (currentValue <= ableBuyNum) {
      buyStockMutation.mutate({stockId, currentValue});
      setModalVisible(true);
      getMyCoinMutation.refetch();
      setTimeout(() => {
        setModalVisible(false);
        navigation.goBack();
      }, 1000);
    } else {
      Alert.alert('잔액이 부족합니다.');
    }
  };

  const handelSellStock = () => {
    if (currentValue <= ableSellNum) {
      sellStockMutation.mutate({stockId, currentValue});
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.goBack();
      }, 1000);
    } else {
      Alert.alert('주식이 부족합니다.');
    }
  };

  const updateValue = (newValue: number) => {
    setCurrentValue(newValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.yellowContainer}>
        {trade === 'buy' ? (
          <Text style={styles.titleText}>구매할 가격</Text>
        ) : (
          <Text style={styles.titleText}>판매할 가격</Text>
        )}
        <View style={{flexDirection: 'row'}}>
          <Text style={[styles.contentText, styles.textColorBlack]}>
            {price.toLocaleString()} 머니
          </Text>
          <Text
            style={{
              marginLeft: 10,
              fontFamily: fonts.LIGHT,
              color: colors.BLACK,
            }}>
            ${(price / 1200).toFixed(2).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.yellowContainer}>
        <Text style={styles.titleText}>수량</Text>
        {trade === 'buy' ? (
          <View>
            {currentValue > 0 ? (
              <Text style={[styles.contentText, styles.textColorBlack]}>
                {currentValue} {type === 'Real' ? '온스' : '주'}
              </Text>
            ) : (
              <Text style={styles.contentText}>
                {type === 'Real'
                  ? '몇 온스(once)구매할까요?'
                  : '몇 주 구매할까요?'}
              </Text>
            )}
            <Text
              style={{
                fontFamily: fonts.LIGHT,
                color: colors.BLACK,
              }}>
              구매 가능 최대 {ableBuyNum} {type === 'Real' ? '온스' : '주'} |{' '}
              {myMoney} 머니
            </Text>
          </View>
        ) : (
          <View>
            {currentValue > 0 ? (
              <Text style={[styles.contentText, styles.textColorBlack]}>
                {currentValue}
              </Text>
            ) : (
              <Text style={styles.contentText}>
                {type === 'Real'
                  ? '몇 온스(once)판매할까요?'
                  : '몇 주 판매할까요?'}
              </Text>
            )}
            <Text
              style={{
                fontFamily: fonts.LIGHT,
                color: colors.BLACK,
              }}>
              핀매 가능 최대 {ableSellNum}주
            </Text>
          </View>
        )}
      </View>

      <KeyPad onInput={updateValue} currentValue={currentValue} />
      {currentValue > 0 ? (
        <TouchableOpacity
          style={
            trade === 'buy'
              ? [styles.buyButton, styles.buttonBox]
              : [styles.sellButton, styles.buttonBox]
          }
          onPress={trade === 'buy' ? handelBuyStock : handelSellStock}>
          <Text
            style={{
              color: colors.WHITE,
              fontFamily: fonts.MEDIUM,
            }}>
            {trade === 'buy' ? '매수' : '매도'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.inactiveButton, styles.buttonBox]}>
          <Text
            style={{
              color: colors.WHITE,
              fontFamily: fonts.MEDIUM,
            }}>
            {trade === 'buy' ? '매수' : '매도'}
          </Text>
        </View>
      )}

      <Modal animationType="fade" visible={modalVisible} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text
              style={{
                fontFamily: fonts.MEDIUM,
                fontSize: 20,
                color: colors.BLACK,
              }}>
              {' '}
              {trade === 'buy' ? '매수 되었습니다' : '매도 되었습니다'}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default InvestTradeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
    alignItems: 'center',
    justifyContent:'center',
    paddingTop: 35,
  },
  yellowContainer: {
    width: 320, // 반응형?
    borderRadius: 10,
    paddingLeft: 18,
    paddingVertical: 20,
    backgroundColor: colors.YELLOW_25,
    marginBottom: 20,
  },
  titleText: {
    fontFamily: fonts.BOLD,
    fontWeight: '500',
    fontSize: 11,
    marginBottom: 10,
    color: colors.BLACK,
  },
  contentText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 25,
    marginBottom: 10,
  },
  textColorBlack: {
    color: colors.BLACK,
  },
  buttonBox: {
    width: 310,
    height: 45,
    marginTop: 35,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: colors.RED_100,
  },
  sellButton: {
    backgroundColor: colors.BLUE_100,
  },
  inactiveButton: {
    backgroundColor: colors.GRAY_50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim the background
  },
  modalBox: {
    width: 320,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.YELLOW_50,
  },
});
