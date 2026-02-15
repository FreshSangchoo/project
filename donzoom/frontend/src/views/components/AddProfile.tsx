import React from 'react';
import {Image, Text, View, StyleSheet} from 'react-native';
import {colors} from '../../constants/colors';

interface Props {
  name: string;
}

const HomeProfile = ({name}: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={require('../../assets/images/characterImage.webp')}
          style={styles.image}
        />
        <Text style={styles.text}>
          <Text style={styles.textName}>{name}</Text>님
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
  profileContainer: {},
  image: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: colors.BLUE_100,
    borderRadius: 50,
  },
  text: {
    fontSize: 12,
    color: colors.BLACK,
    fontWeight: '700',
    width: 80,
    justifyContent: 'center',
    alignItems:'center',
    textAlign: 'center',
  },
  textName: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.BLUE_100,
    fontWeight: '700',
  },
});

export default HomeProfile;
