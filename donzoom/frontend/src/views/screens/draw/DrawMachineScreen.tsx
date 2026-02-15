import React, {useEffect, useState} from 'react';
import Slider from '@react-native-community/slider';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native';
import {usePigStore} from '@/stores/pigStore';
import usePig from '@/hooks/queries/usePig';
import {StyleSheet, Vibration} from 'react-native';
import {colors} from '../../../constants/colors';
import DrawList from '../../components/DrawList';
import DrawMachineSVG from '../../../assets/drawMachine.svg';
import CloseButton from '../../../assets/closeButton.svg';
import Ticket from 'react-native-vector-icons/Ionicons';
import Minus from 'react-native-vector-icons/Feather';
import Plus from 'react-native-vector-icons/Feather';
import {fonts} from '@/constants/font';

function DrawMachineScreen({}) {
  const {
    addOwnedPig,
    pigHistory,
    addPigHistory,
    selectedCard,
    setSelectedCard,
    selectedManyCards,
    setSelectedManyCards,
    isNewCard,
    setIsNewCard,
    isNewCards,
    setIsNewCards,
    isManyDraws,
    setIsManyDraws,
    setPigs,
  } = usePigStore();
  const {
    drawPigMutation,
    getAllPigMutation,
    getMyCoinMutation,
    getMyTicketMutation,
    changeCoinToTicketMutation,
  } = usePig();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isTicketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketValue, setTicketValue] = useState(1);
  const [myCoin, setMyCoin] = useState(0);
  const [myTicket, setMyTicket] = useState(0);
  const [maximumTicketValue, setMaximumTicketValue] = useState(100);

  // 전체 돼지 불러오기
  useEffect(() => {
    if (getAllPigMutation.isSuccess && getAllPigMutation.data) {
      setPigs(getAllPigMutation.data);
    }

    const ticketData = getMyTicketMutation.data?.ticket || 0;
    setMyTicket(ticketData);
    console.log('내 티켓 가져오기: ', ticketData);
  }, [getAllPigMutation.data, getMyTicketMutation.data, setPigs, setMyTicket]);

  // 1회 뽑기
  const drawCard = async () => {
    try {
      const drawnPigs = await drawPigMutation.mutateAsync(1);
      console.log('drawnPigs: ', drawnPigs);
      const selected = {
        pigId: drawnPigs[0].pigId,
        pigName: drawnPigs[0].pigName,
        owned: false,
        description: drawnPigs[0].description,
        imageUrl: drawnPigs[0].imageUrl,
        silhouetteImageUrl: drawnPigs[0].silhouetteImageUrl,
        createdAt: drawnPigs[0].createdAt || null,
      };
      // console.log('이거 뽑았어! ', selected);
      setSelectedCard(selected);
      addPigHistory(selected);

      const isNew = selected.createdAt === null;
      setIsNewCard(isNew);
      if (isNew) addOwnedPig(selected);
      // console.log('selectedCard: ', selectedCard);
      // console.log('imageUrl: ', selectedCard?.imageUrl);
      // 1회 뽑기 모달창 열기
      setIsManyDraws(false);
      setModalVisible(true);
      Vibration.vibrate(100);
      setMyTicket(prev => prev - 1);
    } catch (error) {
      Alert.alert('티켓이 부족합니다!');
    }
  };

  // 5회 뽑기
  const drawManyCard = async () => {
    try {
      const drawnPigs = await drawPigMutation.mutateAsync(5);
      const newCards: boolean[] = [];

      const drawnCards = drawnPigs.map(pig => ({
        pigId: pig.pigId,
        pigName: pig.pigName,
        owned: pig.createdAt !== null,
        description: pig.description,
        imageUrl: pig.imageUrl,
        silhouetteImageUrl: pig.silhouetteImageUrl,
        createdAt: pig.createdAt || null,
      }));

      drawnCards.forEach(card => {
        const isNew = card.createdAt === null;
        // console.log('isNew: ', isNew);
        newCards.push(isNew);
        if (isNew) addOwnedPig(card);
        addPigHistory(card);
      });
      setMyTicket(prev => prev - 5);

      setSelectedManyCards(drawnCards);
      setIsNewCards(newCards);
      setIsManyDraws(true);
      setModalVisible(true);
      Vibration.vibrate(500);
    } catch (error) {
      Alert.alert('티켓이 부족합니다!');
    }
  };

  // 티켓 교환 모달창
  const openTicketModal = () => {
    setTicketValue(1);
    getMyCoinMutation.refetch().then((body : any)=>{
      const {data} = body;
      const coin = data ? data.coin : 0;
      setMyCoin(coin);
      setMaximumTicketValue(Math.floor(coin / 1000000));
      setTicketModalVisible(true);
    });
  };

  const plusTicketValue = () => {
    if (ticketValue < maximumTicketValue) setTicketValue(ticketValue + 1);
  };
  const minusTicketValue = () => {
    if (ticketValue > 1) setTicketValue(ticketValue - 1);
  };

  const changeCoinToTicket = () => {
    if (myCoin >= 5) {
      Alert.alert('티켓 구매 성공!');
      changeCoinToTicketMutation.mutateAsync(ticketValue,{onSuccess:(data :any)=>{
        setMyCoin(data.lastCoin);
        setMyTicket(data.lastTicket)
      }});
      setTicketModalVisible(false);
    } else {
      Alert.alert('코인이 부족합니다.');
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <DrawMachineSVG style={styles.drawMachine} />
        <View style={styles.hasTicketContainer}>
          <Text style={styles.hasTicketText}>내 티켓: {myTicket}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <TouchableOpacity style={styles.button} onPress={drawCard}>
              <Text style={styles.buttonText}>1회 뽑기</Text>
            </TouchableOpacity>
            <View style={{flexDirection: 'row'}}>
              <Ticket name="ticket-outline" size={20} color={colors.BLACK} />
              <Text style={{color: colors.BLACK}}> x 1</Text>
            </View>
          </View>
          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <TouchableOpacity style={styles.button} onPress={drawManyCard}>
              <Text style={styles.buttonText}>5회 뽑기</Text>
            </TouchableOpacity>
            <View style={{flexDirection: 'row'}}>
              <Ticket name="ticket-outline" size={20} color={colors.BLACK} />
              <Text style={{color: colors.BLACK}}> x 5</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.changeTicket} onPress={openTicketModal}>
          <Ticket name="ticket-outline" size={40} color={colors.BLACK} />
          <Text style={styles.tempText}>티켓 교환하러가기 {'>>'}</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.listContainer}>
        <Text style={styles.listTitle}>나의 픽 뽑기 내역</Text>
        {pigHistory
          .slice()
          .reverse()
          .map((drewItem, index) => (
            <DrawList
              key={`${drewItem.id}-${index}`}
              cardName={drewItem.name}
              date={drewItem.date}
              style={[
                styles.drawList,
                index % 2 === 0 ? styles.evenItem : styles.oddItem,
              ]}
            />
          ))}
      </View> */}
      <Modal
        visible={isTicketModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTicketModalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.ticketModalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setTicketModalVisible(false)}>
              <CloseButton />
            </TouchableOpacity>
            <Ticket name="ticket-outline" size={100} color={colors.BLACK} />
            <View style={styles.ticketInputContainer}>
              <TouchableOpacity onPress={minusTicketValue}>
                <Minus name="minus" size={20} color={colors.BLACK} />
              </TouchableOpacity>
              <Slider
                style={{width: 240}}
                value={ticketValue}
                onValueChange={value => setTicketValue(value)}
                minimumValue={1}
                maximumValue={maximumTicketValue}
                minimumTrackTintColor={colors.BLUE_100}
                thumbTintColor={colors.BLUE_100}
                step={1}
              />
              <TouchableOpacity onPress={plusTicketValue}>
                <Plus name="plus" size={20} color={colors.BLACK} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hasCoinText}>현재 보유 코인: {myCoin}</Text>
            <TouchableOpacity
              style={styles.coinChangeButton}
              onPress={changeCoinToTicket}>
              <Text style={styles.coinChangeButtonText}>
                {ticketValue}개 교환하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={styles.modalBackground}
          onTouchEnd={() => setModalVisible(false)}>
          {isManyDraws ? (
            <View style={styles.modalManyContainer}>
              <View style={styles.modalRow}>
                {selectedManyCards?.slice(0, 3).map((card, index) => (
                  <View key={index} style={styles.manyCardsContainer}>
                    {isNewCards && isNewCards[index] && (
                      <Text style={styles.manyNewText}>New!</Text>
                    )}
                    <Image
                      source={{uri: card.imageUrl}}
                      style={{width: 60, height: 60}}
                    />
                    <Text style={styles.manyPigName}>{card.pigName}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.modalRow}>
                {selectedManyCards?.slice(3, 5).map((card, index) => (
                  <View key={index + 3} style={styles.manyCardsContainer}>
                    {isNewCards && isNewCards[index + 3] && (
                      <Text style={styles.manyNewText}>New!</Text>
                    )}
                    <Image
                      source={{uri: card.imageUrl}}
                      style={{width: 60, height: 60}}
                    />
                    <Text style={styles.manyPigName}>{card.pigName}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.modalContainer}>
              {selectedCard && isNewCard && (
                <Text style={styles.newText}>New!</Text>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <CloseButton />
              </TouchableOpacity>
              {selectedCard && (
                <Image
                  source={{uri: selectedCard.imageUrl}}
                  style={{width: 200, height: 200}}
                />
              )}
              {selectedCard && (
                <>
                  <Text style={styles.pigName}>{selectedCard.pigName}</Text>
                  <Text style={styles.pigDescription}>
                    {selectedCard.description}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.YELLOW_100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 60,
  },
  drawMachine: {
    justifyContent: 'center',
    marginBottom: 20,
  },
  hasTicketContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  hasTicketText: {
    color: colors.BLACK,
    fontSize: 16,
    fontFamily: fonts.MEDIUM,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 'auto',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FFFCF2',
    borderColor: colors.BLACK,
    borderWidth: 1,
    borderRadius: 13,
    width: 140,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 5,
  },
  buttonText: {
    color: colors.BLACK,
    textAlign: 'center',
    alignItems: 'center',
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'GmarketSansTTFMedium',
  },
  changeTicket: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempText: {
    color: colors.BLACK,
    fontSize: 30,
    lineHeight: 30,
    textAlign: 'center',
    fontFamily: 'GmarketSansTTFBold',
    marginHorizontal: 5,
  },
  listContainer: {
    backgroundColor: colors.WHITE,
    paddingBottom: 56,
  },
  listTitle: {
    color: colors.BLACK,
    fontSize: 20,
    lineHeight: 24,
    marginLeft: 24,
    marginTop: 30,
    marginBottom: 20,
    fontFamily: 'GmarketSansTTFBold',
  },
  drawList: {
    width: '100%',
    height: 120,
  },
  oddItem: {
    backgroundColor: colors.WHITE,
  },
  evenItem: {
    backgroundColor: colors.YELLOW_25,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  ticketModalContainer: {
    backgroundColor: colors.WHITE,
    width: 320,
    height: 400,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  ticketInputContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 30,
  },
  currentValueText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    marginTop: 10,
  },
  hasCoinText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    marginTop: 20,
    marginBottom: 30,
  },
  coinChangeButton: {
    borderRadius: 10,
    backgroundColor: colors.YELLOW_75,
    width: 160,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinChangeButtonText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
  },
  modalManyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  manyCardsContainer: {
    backgroundColor: colors.YELLOW_100,
    borderRadius: 13,
    width: 100,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    paddingTop: 15,
  },
  modalContainer: {
    width: 280,
    height: 400,
    backgroundColor: colors.YELLOW_100,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  manyNewText: {
    position: 'absolute',
    top: 13,
    fontSize: 12,
    fontFamily: 'GmarketSansTTFBold',
    color: colors.BLACK,
  },
  newText: {
    position: 'absolute',
    top: 20,
    fontSize: 18,
    fontFamily: 'GmarketSansTTFBold',
    color: colors.BLACK,
  },
  pigName: {
    color: colors.BLACK,
    fontFamily: 'GmarketSansTTFBold',
    fontSize: 20,
    marginBottom: 20,
  },
  manyPigName: {
    color: colors.BLACK,
    fontFamily: 'GmarketSansTTFBold',
    fontSize: 14,
    marginTop: 5,
  },
  pigDescription: {
    color: colors.BLACK,
    fontFamily: 'GmarketSansTTFMedium',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
  },
});

export default DrawMachineScreen;
