import CustomButton from '@/views/components/CustomButton';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import useAuth from '@/hooks/queries/useAuth';

function MainScreen({navigation}: any) {
  const {logoutMutation} = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(null, {
      onSuccess: () => {
        console.log('로그아웃 되었습니다.');
      },
    });
  };

  const handleTransfer = () => {
    navigation.navigate('송금');
  };

  return (
    <View>
      <Text>메인화면임.</Text>
      <CustomButton label="로그아웃" onPress={handleLogout} />
      <CustomButton label="계좌이체" onPress={handleTransfer} />
    </View>
  );
}

const styles = StyleSheet.create({});

export default MainScreen;
