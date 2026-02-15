import {colors} from '@/constants/colors';
import useAccount from '@/hooks/queries/useAccount';
import useAccountBalance from '@/hooks/useAccountInfo';
import useForm from '@/hooks/useForm';
import usePasswordStore from '@/stores/usePasswordStore';
import {validateAccount} from '@/utils';
import CustomButton from '@/views/components/CustomButton';
import {useRoute} from '@react-navigation/native';
import React from 'react';
import {Alert, Image, StyleSheet, Text, View} from 'react-native';
import PigIcon from 'react-native-vector-icons/FontAwesome6';

function AccountInitScreen({navigation, route}: any) {
  const {initAccountMutation} = useAccount();
  // const {password} = usePasswordStore();
  const {password} = route.params;
  const {refetch} = useAccountBalance();
  const handelInitAccount = () => {
    initAccountMutation.mutate(password, {
      onSuccess: () => {
        Alert.alert('계좌가 생성되었습니다!');
        refetch();
        navigation.navigate('홈화면');
      },
      onError: () => {
        Alert.alert('오류가 발생했습니다');
      },
    });
  };

  return (
    <View style={styles.container}>
      <PigIcon name="piggy-bank" size={150} color={'pink'} />
      <CustomButton
        style={styles.button}
        label="계좌 개설하기"
        onPress={handelInitAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 50,
  },
});

export default AccountInitScreen;
