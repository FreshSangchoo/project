import React from 'react';
import {Image, Text, View, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';
import {fonts} from '@/constants/font';
import {useSignupStore} from '@/stores/useAuthStore';

interface Props {
  name: string;
}

const HomeProfile = ({name}: Props) => {
  const {profileImage} = useSignupStore();
  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri:
              profileImage === undefined || profileImage === null
                ? 'http://j11a108.p.ssafy.io:8081/api/uploads/676e51cb-fcd0-41fc-a07c-f8fea8e99f4f.png'
                : profileImage,
          }}
          style={styles.image}
        />
        <Text style={styles.text}>
          <Text style={styles.textName}>{name}</Text>님 어서오세요!
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 10,
  },
  profileContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FFE37F',
    borderRadius: 50,
  },
  text: {
    marginLeft: 20,
    textAlign: 'center',
    fontSize: 20,
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
  },
  textName: {
    width: 80,
    textAlign: 'center',
    fontSize: 32,
    color: colors.BLUE_100,
    fontFamily: fonts.BOLD,
  },
});

export default HomeProfile;
