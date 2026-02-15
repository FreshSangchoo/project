import React, {useEffect, useState} from 'react';
import useAuth from '@/hooks/queries/useAuth';
import AuthStackNavigator from '../AuthStackNavigator';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Footer from '../Footer';
import {View, ActivityIndicator} from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const {isLogin, autoLoginMutation} = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const attemptAutoLogin = async () => {
  //     try {
  //       await autoLoginMutation.mutateAsync(null);
  //     } catch (error) {
  //       console.log('Auto login failed:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   attemptAutoLogin();
  // }, []);

  // if (isLoading) {
  //   return (
  //     <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
  //       <ActivityIndicator size="large" />
  //     </View>
  //   );
  // }

  return (
    <Stack.Navigator>
      {isLogin ? (
        <Stack.Screen
          name="Footer"
          component={Footer}
          options={{headerShown: false}}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{headerShown: false}}
        />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
