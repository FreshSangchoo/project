import Article from '@/pages/Article/Article';
import PushSettingPage from '@/pages/my-page/PushSettingPage';
import Notification from '@/pages/notification/Notification';
import ModelSearchPage from '@/pages/upload/ModelSearchPage';
import UploadIndexPage from '@/pages/upload/UploadIndexPage';
import UploadModelManual from '@/pages/upload/UploadModelManual';
import UploadModelPage from '@/pages/upload/UploadModelPage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types/home-stack';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UploadIndexPage" component={UploadIndexPage} />
      <Stack.Screen name="ModelSearchPage" component={ModelSearchPage} />
      <Stack.Screen name="UploadModelPage" component={UploadModelPage} />
      <Stack.Screen name="UploadModelManual" component={UploadModelManual} />
      <Stack.Screen name="Notification" component={Notification} />
      <Stack.Screen name="Article" component={Article} />
      <Stack.Screen name="PushSettingPage" component={PushSettingPage} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
