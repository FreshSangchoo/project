import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {TouchableOpacity} from 'react-native';
import {StyleSheet} from 'react-native';
import DrawMachineScreen from '../views/screens/draw/DrawMachineScreen';
import DrawCollectionScreen from '@/views/screens/draw/DrawCollectionScreen';

import CollectionButton from '@/assets/collectionButton.svg';

const DrawStackNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerTitleAlign: 'center'}}>
      <Stack.Screen
        name="돼지뽑기"
        component={DrawMachineScreen}
        options={({navigation}) => ({
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('픽수집함')}>
              <CollectionButton width={24} height={24} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="픽수집함" component={DrawCollectionScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({});

export default DrawStackNavigator;
