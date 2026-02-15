import React, {useState} from 'react';
import {TouchableOpacity, Image, StyleSheet, Text, View} from 'react-native';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import CustomButton from '@/views/components/CustomButton';
import {useSignupStore} from '@/stores/useAuthStore';

function CheckFamilyScreen({navigation}: any) {
  const {isParent, setIsParent} = useSignupStore();

  return (
    <View style={styles.container}>
      <View style={styles.imgContainer}>
        <Image source={require('@/assets/image/pig.png')} style={styles.pig} />
      </View>
      <View>
        <Text style={styles.signupText}>돈 줌(Zoom) 회원가입</Text>
      </View>
      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[styles.option, !isParent && styles.selectedOptionChild]}
          onPress={() => setIsParent(false)}>
          <View style={[styles.radioOuter, !isParent && styles.selectedRadio]}>
            {!isParent && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.childOptionText}>아이 </Text>
          <Text style={styles.optionText}>입니다.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, isParent && styles.selectedOptionParent]}
          onPress={() => setIsParent(true)}>
          <View style={[styles.radioOuter, isParent && styles.selectedRadio]}>
            {isParent && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.parentOptionText}>부모 </Text>
          <Text style={styles.optionText}>입니다.</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.nextButtonContainer}>
        <CustomButton
          label="다음으로"
          variant="auth"
          isParent={isParent}
          onPress={() => navigation.navigate('닉네임 설정')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 0,
    margin: 0,
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  imgContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pig: {
    width: 152,
    height: 152,
    marginTop: 34,
    justifyContent: 'center',
  },
  signupText: {
    marginTop: 13,
    fontSize: 18,
    fontFamily: 'GmarketSansTTFBold',
    color: colors.BLACK,
    textAlign: 'center',
  },
  nextButtonContainer: {
    marginTop: 35,
  },
  option: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.GRAY_50,
    borderRadius: 5,
    width: '100%',
    height: 40,
  },
  selectedOptionChild: {
    borderColor: colors.YELLOW_100,
  },
  selectedOptionParent: {
    borderColor: colors.BLUE_100,
  },
  radio: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 18,
    width: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.GRAY_50,
    marginRight: 10,
  },
  radioOuter: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 18,
    width: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.GRAY_50,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 6,
    backgroundColor: colors.BLUE_100,
  },
  selectedRadio: {
    borderColor: colors.BLUE_100,
  },
  optionText: {
    fontSize: 14,
    fontFamily: fonts.LIGHT,
    color: colors.BLACK,
  },
  childOptionText: {
    fontSize: 14,
    fontFamily: fonts.BOLD,
    color: colors.YELLOW_100,
  },
  parentOptionText: {
    fontSize: 14,
    fontFamily: fonts.BOLD,
    color: colors.BLUE_100,
  },
  optionContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 37,
    width: 250,
    gap: 13,
  },
});

export default CheckFamilyScreen;
