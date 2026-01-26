import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import IconAlertSquareRoundedFilled from '@/assets/icons/IconAlertSquareRoundedFilled.svg';
import CustomerService from '@/components/common/CustomerService';
import { semanticColor } from '@/styles/semantic-color';

const NoticeCard = () => {
  return (
    <View>
      <CustomerService
        infoIcon={<IconAlertSquareRoundedFilled width={24} height={24} fill={semanticColor.icon.homeOrange} />}
        title="거래 지원 악기류 확대 예정"
        subTitle="이펙터 외에 다른 악기류의 거래 지원은 확장 후
안내드릴게요. 기다려 주셔서 감사합니다!"
        isGray={true}
        activeOpacity={1}
        onPress={() => {}}
      />
    </View>
  );
};

export default NoticeCard;
