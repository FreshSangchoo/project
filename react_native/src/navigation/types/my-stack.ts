import { MerchandiseCardProps } from '@/components/common/merchandise-card/MerchandiseCard';

export type MyStackParamList = {
  ProfileEditPage: undefined;
  AccountManagePage: undefined;
  VerifyPage: undefined;
  VerifyInfoPage: undefined;
  PushSettingPage: undefined;
  BlockedUserList: undefined;
  DeleteAccountCautionPage: undefined;
  DeleteAccountPage: undefined;
  TermsAndConditionsPage: undefined;
  TransactionLogPage: undefined;
  PullUpPage: { postId: number; card?: MerchandiseCardProps; onDone: () => void };
  RecentSeenLogPage: undefined;
  FavoriteLogPage: undefined;
  Notification: undefined;
  UploadIndexPage: {
    brand?: string;
    modelName?: string;
    category?: string;
    origin?: 'Home' | 'Explore' | 'My';
  };
  ModelSearchPage: { origin?: 'Home' | 'Explore' | 'My' };
  UploadModelPage: {
    brand?: string;
    modelName?: string;
    category?: string;
    onPress?: () => void;
    origin?: 'Home' | 'Explore' | 'My' | 'Detail';
    mode?: 'create' | 'edit';
    postId?: number;
  };
  UploadModelManual: { origin?: 'Home' | 'Explore' | 'My' };
  NewPassword: { from: 'My' | 'AccountManagePage' };
  ChangePassword: { from: 'My' | 'AccountManagePage' };
};
