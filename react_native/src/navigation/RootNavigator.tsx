import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NavBar from '@/components/common/NavBar';
import HomeStackNavigator from '@/navigation/HomeStackNavigator';
import ExploreStackNavigator from '@/navigation/ExploreStackNavigator';
import ChatStackNavigator from '@/navigation/ChatStackNavigator';
import MyStackNavigator from '@/navigation/MyStackNavigator';
import CommonStackNavigator from './CommonStackNavigator';
import { RootStackParamList } from '@/navigation/types/root';
import CertificationStackNavigator from '@/navigation/CertificationStackNavigator';
import AuthStackNavigator from '@/navigation/AuthStackNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  initialRoute: keyof RootStackParamList;
};

function RootNavigator({ initialRoute }: RootNavigatorProps) {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="AuthStack" component={AuthStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="NavBar"
        component={NavBar}
        options={{ headerShown: false }}
        initialParams={{ screen: 'Home' }}
      />
      <Stack.Screen name="HomeStack" component={HomeStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ExploreStack" component={ExploreStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ChatStack" component={ChatStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="MyStack" component={MyStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="CertificationStack"
        component={CertificationStackNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="CommonStack" component={CommonStackNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default RootNavigator;
