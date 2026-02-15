import React, {useCallback, useMemo, useState} from 'react';
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
import axiosInstance from '@/api/axios';
import {useFocusEffect} from '@react-navigation/native';
import {ResponseReports} from '@/api/stock';
import useStock from '@/hooks/queries/useStock';

interface Report {
  Id: number;
  title: string;
  contents: string;
  createdAt: Date;
  source: string;
}

type StockName =
  | '삼성전자'
  | 'LG전자'
  | '네이버'
  | '카카오'
  | '금'
  | 'Apple'
  | 'Google'
  | 'Tesla';

const StockId: Record<StockName, number> = {
  삼성전자: 1,
  LG전자: 2,
  네이버: 3,
  카카오: 4,
  금: 5,
  Apple: 6,
  Google: 7,
  Tesla: 8,
};

const UnsafeAssetReportTabScreen = ({navigation, selectedStock}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Report | null>(null);

  const getStockId = (selectedStock: string): number => {
    return StockId[selectedStock as StockName];
  };
  const stockId = useMemo(() => getStockId(selectedStock), [selectedStock]);
  const {useGetTodaysReports} = useStock();
  const {
    data: todaysReports = [] as ResponseReports,
    isLoading,
    error,
  } = useGetTodaysReports(stockId, {
    enabled: !!stockId, // stockId 있을때 실행
  });

  const openModal = (report: Report) => {
    setSelectedReports(report);
    setModalVisible(true);
  };

  // 날짜 형식 바꾸기
  // date를 YYYY.MM.DD로 포맷팅
  const formatDate = (dateStr: Date) => {
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  };
  // 제목파싱
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
  // 스톡아이디 없는경우
  if (!stockId) {
    return (
      <View style={styles.container}>
        <Text>종목을 선택해주세요</Text>
      </View>
    );
  }
  if (stockId && todaysReports.length < 1) {
    return (
      <View style={styles.container}>
        <Text>오늘의 {selectedStock} 리포트가 없습니다</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('UnsafeAssetPastReport', {stockId})
          }>
          <View style={styles.button}>
            <Text style={{fontFamily: fonts.MEDIUM, color: colors.BLACK}}>
              지난 리포트 보기
            </Text>
            <Icon name="chevron-right" size={25} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {todaysReports.map((report: Report, index: number) => (
        <TouchableOpacity
          onPress={() => openModal(report)}
          key={report.Id || index}
          style={styles.reportContainer}>
          <Text style={styles.headText}> {formatTitle(report.title)}</Text>
          <View style={{marginLeft: 210}}>
            <Text style={styles.headContentText}> {report.source}</Text>
            <Text style={styles.headContentText}>
              {formatDate(report.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <View>
        <Modal animationType="fade" visible={modalVisible} transparent={true}>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalVisible(false);
            }}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <Text style={styles.headText}> {selectedReports?.title}</Text>
                  <View style={{marginTop: 15, flex: 1}}>
                    <ScrollView>
                      <Text style={styles.modalBodyText}>
                        {selectedReports?.contents}
                      </Text>
                    </ScrollView>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('UnsafeAssetPastReport', {stockId})}>
        <View style={styles.button}>
          <Text style={{fontFamily: fonts.MEDIUM, color: colors.BLACK}}>
            지난 리포트 보기
          </Text>
          <Icon name="chevron-right" size={25} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default UnsafeAssetReportTabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.WHITE,
  },
  reportContainer: {
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
