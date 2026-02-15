import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import {StyleSheet} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {usePigStore} from '@/stores/pigStore';
import usePig from '@/hooks/queries/usePig';

import CloseButton from '@/assets/closeButton.svg';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';

function DrawCollectionScreen() {
  const {pigs, setPigs, selectedCard, setSelectedCard} = usePigStore();
  const {getAllPigMutation} = usePig();
  const [filter, setFilter] = useState('전체보기');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (getAllPigMutation.isSuccess && getAllPigMutation.data) {
      setPigs(getAllPigMutation.data);
      // console.log('전체 돼지: ', getAllPigMutation.data);
    }
  }, [getAllPigMutation.data, setPigs]);

  // 필터
  const getFilteredPigs = () => {
    switch (filter) {
      case '보유한 돼지':
        return pigs.filter(pig => pig.createdAt !== null);
      case '미보유 돼지':
        return pigs.filter(pig => pig.createdAt === null);
      default:
        return pigs;
    }
  };

  const filteredPigs = getFilteredPigs().sort((a, b) => a.pigId - b.pigId);
  // console.log('필터 피그: ', filteredPigs);

  // 모달
  const handleCardPress = (pig: typeof selectedCard) => {
    setSelectedCard(pig);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionContainer}>
        <Picker
          selectedValue={filter}
          style={styles.picker}
          onValueChange={itemValue => setFilter(itemValue)}>
          <Picker.Item
            label="전체보기"
            value="전체보기"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="보유한 돼지"
            value="보유한 돼지"
            style={styles.pickerItem}
          />
          <Picker.Item
            label="미보유 돼지"
            value="미보유 돼지"
            style={styles.pickerItem}
          />
        </Picker>
        {filter === '전체보기' && (
          <View>
            <Text style={styles.hasPig}>
              {pigs.filter(pig => pig.createdAt !== null).length} /{' '}
              {pigs.length}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.collectionContainer}>
        <FlatList
          data={filteredPigs}
          keyExtractor={item => item.pigId.toString()}
          numColumns={3}
          contentContainerStyle={styles.flatListContent}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => handleCardPress(item)}>
              <View style={styles.pigContainer}>
                {item.createdAt !== null ? (
                  <Image source={{uri: item.imageUrl}} width={80} height={80} />
                ) : (
                  <Image source={{uri: item.imageUrl}} width={80} height={80} />
                )}
                <Text style={styles.pigName}>{item.pigName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={styles.modalBackground}
          onTouchEnd={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}>
              <CloseButton />
            </TouchableOpacity>
            {selectedCard && (
              <>
                {selectedCard.createdAt !== null ? (
                  <Image
                    source={{uri: selectedCard.imageUrl}}
                    style={{
                      width: 200,
                      height: 200,
                    }}
                  />
                ) : (
                  <Image
                    source={{uri: selectedCard.imageUrl}}
                    style={{
                      width: 200,
                      height: 200,
                    }}
                  />
                )}
                <Text style={styles.pigNameModal}>{selectedCard.pigName}</Text>
                <Text style={styles.pigDescriptionModal}>
                  {selectedCard.description}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    paddingBottom: 40,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
    alignItems: 'center',
  },
  picker: {
    width: 150,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  pickerItem: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  hasPig: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_100,
  },
  collectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListContent: {
    paddingBottom: 200,
  },
  pigContainer: {
    width: 110,
    height: 150,
    backgroundColor: colors.YELLOW_75,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 13,
    elevation: 4,
    paddingTop: 10,
  },
  pigName: {
    marginTop: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  pigNameModal: {
    marginBottom: 15,
    fontFamily: fonts.BOLD,
    color: colors.BLACK,
    fontSize: 20,
  },
  pigDescriptionModal: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});

export default DrawCollectionScreen;
