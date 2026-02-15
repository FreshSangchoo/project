import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {colors} from '@/constants/colors';
import {LocaleConfig} from 'react-native-calendars';

LocaleConfig.locales['fr'] = {
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  dayNames: [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'fr';

const CustomCalendar = ({selectedDate, onDateSelect}:any) => {
  const handleDayPress = (day:any) => {
    onDateSelect(day.dateString); //props에 인자 담아 넘기기 
  };

  const markedDates = selectedDate // 선택된 날짜에 마크 
    ? {[selectedDate]: {selected: true, selectedColor: colors.BLUE_100},}
    : {};

  return (
    <View>
      <Calendar
        style={styles.container}
        monthFormat={'yyyy년 MM월'}
        disableArrowLeft={true}
        enableSwipeMonths={true}
        minDate={new Date().toISOString().split('T')[0]}
        onDayPress={handleDayPress} // 날짜 클릭할떄 
        markedDates={markedDates} // 동그라미할 날짜
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    width: 400,
    height:450,
  },
});

export default CustomCalendar;
