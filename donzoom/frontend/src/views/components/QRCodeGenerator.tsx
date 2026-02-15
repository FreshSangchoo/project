import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useAccount from '@/hooks/queries/useAccount';
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QRCodeGenerator = ({navigation}: any) => {
  // QR 코드로 변환할 JSON 데이터
  const {getAccount} = useAccount();

  const accountData = {
    accountNumber: getAccount.data?.rec[0].accountNo,
    bank: '싸피은행',
  };

  // JSON 데이터를 문자열로 변환
  const jsonData = JSON.stringify(accountData);

  return (
    <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
      {accountData.accountNumber ? (
        <QRCode
          value={jsonData} // QR 코드로 변환할 데이터
          size={200} // QR 코드 크기
        />
      ) : (
        <View style={styles.container}>
          <Text style={styles.nullText}>먼저 계좌를 생성해주세요.</Text>
          <TouchableOpacity
            style={styles.goButton}
            onPress={() => navigation.navigate('계좌 생성')}>
            <Text style={styles.goButtonText}>계좌 생성하러 가기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nullText: {
    color: colors.BLACK,
    fontSize: 24,
    fontFamily: fonts.MEDIUM,
    marginBottom: 30,
  },
  goButton: {
    width: 220,
    height: 50,
    backgroundColor: colors.YELLOW_50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 18,
  },
});

export default QRCodeGenerator;
