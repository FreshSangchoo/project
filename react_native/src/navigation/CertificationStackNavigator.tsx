import Certification from '@/pages/Certification/Certification';
import CertificationAuth from '@/pages/Certification/CertificationAuth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CertificationStackParamList } from '@/navigation/types/certification-stack';
import CertificationCommon from '@/pages/Certification/CertificationCommon';

const Stack = createNativeStackNavigator<CertificationStackParamList>();

const CertificationStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Certification" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Certification" component={Certification} />
      <Stack.Screen name="CertificationAuth" component={CertificationAuth} />
      <Stack.Screen name="CertificationCommon" component={CertificationCommon} />
    </Stack.Navigator>
  );
};

export default CertificationStackNavigator;
