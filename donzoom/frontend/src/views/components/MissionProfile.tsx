import React from 'react';
import {Image, Text, View, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {fonts} from '@/constants/font';
import {useSignupStore} from '@/stores/useAuthStore';

interface Props {
  name: string;
}

const MissionProfile = ({name}: Props) => {
  const {profileImage} = useSignupStore();
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            profileImage === undefined || profileImage === null
              ? 'http://j11a108.p.ssafy.io:8081/api/uploads/676e51cb-fcd0-41fc-a07c-f8fea8e99f4f.png'
              : profileImage,
        }}
        style={styles.image}
      />
      <Text style={styles.text}> {name} </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
  },
  image: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderColor: colors.BLUE_100,
    borderRadius: 50,
  },
  text: {
    fontSize: 26,
    marginLeft: 12,
    color: colors.BLUE_100,
    fontFamily: fonts.BOLD,
    fontWeight: '700',
  },
});

export default MissionProfile;
