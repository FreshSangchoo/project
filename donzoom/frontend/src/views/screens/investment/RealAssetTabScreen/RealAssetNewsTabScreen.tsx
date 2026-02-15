import React, {useCallback, useState} from 'react';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import {
  TouchableWithoutFeedback,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useStock from '@/hooks/queries/useStock';

type News = {
  Id: number;
  title: string;
  contents: string;
  createdAt: Date;
  source: string;
};

const RealAssetNewsTabScreen = ({navigation}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const {useGetTodaysNews} = useStock();

  const {data: todaysNews = []} = useGetTodaysNews(5);

  const openModal = (news: News) => {
    setSelectedNews(news);
    setModalVisible(true);
  };

  // 날짜 형식 바꾸기
  // date를 YYYY.MM.DD로 포맷팅
  const formatDate = (dateStr: Date) => {
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  };

  //  타이틀 적당히 자르기
  const formatTitle = (title: string) => {
    const words = title.split(' ');
    let formattedTitle = '';
    let currentLineLength = 0;
    for (let word of words) {
      if (currentLineLength + word.length + 1 > 15) {
        if (formattedTitle.includes('\n')) {
          formattedTitle += '...';
          break;
        }
        formattedTitle += '\n' + word + ' ';
        currentLineLength = word.length + 1;
      } else {
        formattedTitle += word + ' ';
        currentLineLength += word.length + 1;
      }
    }
    return formattedTitle.trim();
  };

  if (todaysNews.length < 1) {
    return (
      <View style={styles.container}>
        <Text> 오늘의 새로운 뉴스가 없습니다</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('RealAssetPastNews')}>
          <View style={styles.button}>
            <Text style={{fontFamily: fonts.MEDIUM, color: colors.BLACK}}>
              지난 뉴스 보기
            </Text>
            <Icon name="chevron-right" size={25} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {todaysNews.length >= 1 &&
        todaysNews?.map(news => (
          <TouchableOpacity
            onPress={() => openModal(news)}
            key={news.Id}
            style={styles.newsContainer}>
            <Text style={styles.headText}> {formatTitle(news.title)}</Text>
            <View style={{marginLeft: 210}}>
              <Text style={styles.headContentText}> {news.source}</Text>
              <Text style={styles.headContentText}>
                {formatDate(news.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      <View>
        <Modal animationType="fade" visible={modalVisible} transparent={true} >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                setModalVisible(false);
              }}>
              <View style={[styles.modalContainer, {flex: 1}]}>
                <TouchableWithoutFeedback>
                  <Text style={styles.headText}> {selectedNews?.title}</Text>
                  <View style={{marginTop: 15, flex: 1}}>
                    <ScrollView style={{flex: 1}}>
                      <Text style={styles.modalBodyText}>
                        {selectedNews?.contents}
                      </Text>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('RealAssetPastNews')}>
        <View style={styles.button}>
          <Text style={{fontFamily: fonts.MEDIUM, color: colors.BLACK}}>
            지난 뉴스 보기
          </Text>
          <Icon name="chevron-right" size={25} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RealAssetNewsTabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.WHITE,
  },
  newsContainer: {
    height: 110,
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: colors.YELLOW_100,
    borderRadius: 10,
    padding: 20,
    margin: 5,
  },
  headText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 20,
    color: colors.BLACK,
    textAlign: 'center',
    marginTop: 20,
  },
  headContentText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 10,
    color: colors.BLACK,
  },
  modalContainer: {
    flex: 1,
    width: '90%',
    maxHeight: '60%',
    backgroundColor: colors.YELLOW_50,
    padding: 30,
  },
  modalBodyText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 200,
  },
});
