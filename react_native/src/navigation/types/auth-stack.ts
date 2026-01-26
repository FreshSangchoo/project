import { Provider } from '@/types/user';
export type AuthCodePurpose = 'EMAIL_VERIFICATION ' | 'PASSWORD_RESET';

export type AuthStackParamList = {
  Welcome: {
    token?: string;
    provider?: Provider;
  };
  EmailEnter: undefined;
  EmailCheck: undefined;
  EmailLogin: undefined;
  AuthCode: {
    type: AuthCodePurpose;
  };
  ForgotPassword: undefined;
  ForgotPasswordViaEmail: undefined;
  ForgotEmail: undefined;
  SetNickname: undefined;
  SetPassword: {
    code?: string;
    isReset?: boolean;
    isCertification?: boolean;
  };
};
