import {Dimensions, StyleSheet, View, Text, ViewStyle} from 'react-native';
import {colors} from '../../constants/colors';
import Card from '../components/Card';

const {width} = Dimensions.get('window');

interface DrawListProps {
  cardName: string;
  date: string;
  style?: ViewStyle | ViewStyle[];
}

function DrawList({cardName, date, style}: DrawListProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.cardContainer}>
        <Card />
      </View>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{date}</Text>
      </View>
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>{cardName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width,
    height: 120,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'E5E7EB',
    padding: 10,
  },
  cardContainer: {
    width: 70,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  dateContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    textAlign: 'left',
    marginTop: 5,
  },
  dateText: {
    color: colors.GRAY_100,
    fontFamily: 'GmarketSansTTFMedium',
    fontSize: 12,
    textAlign: 'left',
  },
  nameContainer: {
    textAlign: 'right',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  nameText: {
    color: colors.BLACK,
    fontFamily: 'GmarketSansTTFMedium',
    fontSize: 18,
    textAlign: 'right',
  },
});

export default DrawList;
