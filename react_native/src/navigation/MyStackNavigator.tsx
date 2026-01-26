import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileEditPage from '@/pages/my-page/ProfileEditPage';
import BlockedUserList from '@/pages/my-page/BlockedUserList';
import DeleteAccountCautionPage from '@/pages/my-page/DeleteAccountCautionPage';
import DeleteAccountPage from '@/pages/my-page/DeleteAccountPage';
import AccountManagePage from '@/pages/my-page/AccountManagePage';
import VerifyPage from '@/pages/my-page/VerifyPage';
import VerifyInfoPage from '@/pages/my-page/VerifyInfoPage';
import PushSettingPage from '@/pages/my-page/PushSettingPage';
import TermsAndConditionsPage from '@/pages/my-page/TermsAndConditionsPage';
import TransactionLogPage from '@/pages/my-page/TransactionLogPage';
import RecentSeenLogPage from '@/pages/my-page/RecentSeenLogPage';
import FavoriteLogPage from '@/pages/my-page/FavoriteLogPage';
import Notification from '@/pages/notification/Notification';
import { MyStackParamList } from '@/navigation/types/my-stack';
import UploadIndexPage from '@/pages/upload/UploadIndexPage';
import ModelSearchPage from '@/pages/upload/ModelSearchPage';
import UploadModelPage from '@/pages/upload/UploadModelPage';
import UploadModelManual from '@/pages/upload/UploadModelManual';
import PullUpPage from '@/pages/my-page/PullUpPage';
import NewPassword from '@/pages/my-page/NewPassword';
import ChangePassword from '@/pages/my-page/ChangePassword';

const Stack = createNativeStackNavigator<MyStackParamList>();

function MyStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileEditPage" component={ProfileEditPage} />
      <Stack.Screen name="AccountManagePage" component={AccountManagePage} />
      <Stack.Screen name="VerifyPage" component={VerifyPage} />
      <Stack.Screen name="VerifyInfoPage" component={VerifyInfoPage} />
      <Stack.Screen name="PushSettingPage" component={PushSettingPage} />
      <Stack.Screen name="BlockedUserList" component={BlockedUserList} />
      <Stack.Screen name="DeleteAccountCautionPage" component={DeleteAccountCautionPage} />
      <Stack.Screen name="DeleteAccountPage" component={DeleteAccountPage} />
      <Stack.Screen name="TermsAndConditionsPage" component={TermsAndConditionsPage} />
      <Stack.Screen name="TransactionLogPage" component={TransactionLogPage} />
      <Stack.Screen name="PullUpPage" component={PullUpPage} />
      <Stack.Screen name="RecentSeenLogPage" component={RecentSeenLogPage} />
      <Stack.Screen name="FavoriteLogPage" component={FavoriteLogPage} />
      <Stack.Screen name="Notification" component={Notification} />
      <Stack.Screen name="UploadIndexPage" component={UploadIndexPage} />
      <Stack.Screen name="ModelSearchPage" component={ModelSearchPage} />
      <Stack.Screen name="UploadModelPage" component={UploadModelPage} />
      <Stack.Screen name="UploadModelManual" component={UploadModelManual} />
      <Stack.Screen name="NewPassword" component={NewPassword} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
    </Stack.Navigator>
  );
}

export default MyStackNavigator;
