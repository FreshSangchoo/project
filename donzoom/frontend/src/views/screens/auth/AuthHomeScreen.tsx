import React from 'react';
import {Button, Pressable, SafeAreaView, StyleSheet, View} from 'react-native';

const AuthHomeScreen = ({navigation}: any) => {
  return (
    <SafeAreaView>
      <View>
        <Button
          title="로그인화면으로 이동"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
      <View>
        <Button
          title="미션페이지로 이동"
          onPress={() => navigation.navigate('Mission')}
        />
      </View>
      <View>
        <Button
          title="거래내역 이동"
          onPress={() => navigation.navigate('AccountHistory')}
        />
      </View>
      <View>
        <Button
          title="돼지 뽑기 이동"
          onPress={() => navigation.navigate('돼지뽑기')}
        />
      </View>
      <View>
        <Button
          title="퀴즈 풀기 이동"
          onPress={() => navigation.navigate('퀴즈')}
        />
      </View>
      <View>
        <Button
          title="더보기 페이지 이동"
          onPress={() => navigation.navigate('더보기')}
        />
      </View>
      <View>
        <Button
          title="알람 페이지 이동"
          onPress={() => navigation.navigate('알람')}
        />
      </View>
      <View>
        <Button
          title="송금 페이지 이동"
          onPress={() => navigation.navigate('송금')}
        />
      </View>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({});

export default AuthHomeScreen;
