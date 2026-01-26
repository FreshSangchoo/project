import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonStackParamList } from '@/navigation/types/common-stack';
import AosBottomSheet from '@/pages/common/AosBottomSheet';

const Stack = createNativeStackNavigator<CommonStackParamList>();

function CommonStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AosBottomSheet" component={AosBottomSheet} />
    </Stack.Navigator>
  );
}

export default CommonStackNavigator;
