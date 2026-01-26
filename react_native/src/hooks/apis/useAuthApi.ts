import { ENDPOINTS } from '@/config';
import DeviceInfo from 'react-native-device-info';
import { shutdownChannelIO } from '@/libs/channel';
import { AuthCodePurpose } from '@/navigation/types/auth-stack';
import EncryptedStorage from 'react-native-encrypted-storage';
import useApi from '@/hooks/apis/useApi';
import { Provider } from '@/types/user';

interface postVerifyCodeProps {
  email: string;
  code: string;
  type: AuthCodePurpose;
}

interface postSigninProps {
  email?: string;
  password?: string;
  token?: string;
  state?: string;
  provider: Provider;
  deviceToken: string;
}

interface postCreateAccountProps {
  email: string;
  password: string;
  code: string;
}

interface postResetPasswordProps {
  email: string;
  code: string;
  newPassword: string;
}

interface PostSettingPhoneProps {
  name: string;
  userId: string;
  phone: string;
}

const useAuthApi = () => {
  const { authApi, authApiNoInterceptor } = useApi();

  const clearAuthStorage = async () => {
    await Promise.all([
      EncryptedStorage.removeItem('accessToken'),
      EncryptedStorage.removeItem('refreshToken'),
      EncryptedStorage.removeItem('provider'),
    ]);
  };

  const postReissue = (refreshToken: string) => {
    return authApi
      .post(ENDPOINTS.AUTH.REISSUE, { refreshToken: refreshToken }, { suppressGlobalErrorToast: true })
      .then(async ({ data }) => {
        await EncryptedStorage.setItem('refreshToken', String(data.data.refreshToken));
        await EncryptedStorage.setItem('accessToken', String(data.data.accessToken));
        await EncryptedStorage.setItem('provider', String(data.data.provider));
        return true;
      })
      .catch(error => {
        throw error;
      });
  };

  const postEmailCheck = (email: string) => {
    return authApi
      .post(ENDPOINTS.AUTH.EMAIL_CHECK, { email: email })
      .then(() => {
        return false;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  const postEmailSend = (email: string, type: AuthCodePurpose) => {
    return authApi.post(ENDPOINTS.AUTH.CODE_SEND, { email: email, type: type }).catch(error => {
      throw error;
    });
  };

  const getCheckNickname = (nickname: string) => {
    return authApi
      .get(ENDPOINTS.AUTH.NICKNAME, { params: { nickname: nickname } })
      .then(() => {
        return true;
      })
      .catch(error => {
        console.log('[useAuthApi][getCheckNickname] error: ', error);
        return false;
      });
  };

  const postSignin = ({ email, password, token, provider, deviceToken }: postSigninProps) => {
    return authApi
      .post(ENDPOINTS.AUTH.SIGNIN(provider), {
        email: email || '',
        password: password || '',
        token: token || '',
        deviceToken: deviceToken || '',
      })
      .then(async ({ data }) => {
        await EncryptedStorage.setItem('refreshToken', String(data.data.refreshToken));
        await EncryptedStorage.setItem('accessToken', String(data.data.accessToken));
        await EncryptedStorage.setItem('provider', String(data.data.provider));
        return data.data.role;
      })
      .catch(async (error) => {
        if (error.response?.status === 400) {
          return false;
        }
        // 403: 소셜로그인 신규 유저 - JWT 토큰을 EncryptedStorage에 저장
        if (error.response?.status === 403) {
          const responseData = error.response?.data?.data || error.response?.data;
          if (responseData?.accessToken) {
            await EncryptedStorage.setItem('accessToken', String(responseData.accessToken));
            if (responseData.refreshToken) {
              await EncryptedStorage.setItem('refreshToken', String(responseData.refreshToken));
            }
            if (responseData.provider) {
              await EncryptedStorage.setItem('provider', String(responseData.provider));
            }
            console.log('[postSignin] 403: JWT token saved to EncryptedStorage');
          }
        }
        console.log('[postSignin] error: ', error);
        throw error;
      });
  };

  const postVerifyCode = ({ email, code, type }: postVerifyCodeProps) => {
    return authApi
      .post(ENDPOINTS.AUTH.CODE_VERIFY, {
        email: email,
        code: code,
        type: type,
      })
      .then(({ data }) => {
        return {
          isValid: true,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          provider: data.data.provider,
        };
      })
      .catch(() => {
        return {
          isValid: false,
          accessToken: '',
          refreshToken: '',
          provider: '',
        };
      });
  };

  const postLogout = async () => {
    const accessToken = await EncryptedStorage.getItem('accessToken');
    try {
      await authApi.post(ENDPOINTS.AUTH.LOGOUT, undefined, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return { ok: true };
    } catch (error: any) {
      const reason = error?.response?.data?.resultMsg || error?.response?.data?.reason || error?.response?.data?.errors;
      return { ok: false, reason };
    } finally {
      await shutdownChannelIO();
      await clearAuthStorage();
    }
  };

  // 익명 토큰 발급
  const postAnonymous = async () => {
    const UUID = await DeviceInfo.getUniqueId();
    try {
      const { data } = await authApi.post(
        ENDPOINTS.AUTH.ANONYMOUS,
        { deviceUuid: UUID },
        { suppressGlobalErrorToast: true },
      );

      await Promise.all([
        EncryptedStorage.setItem('refreshToken', String(data.data.refreshToken)),
        EncryptedStorage.setItem('accessToken', String(data.data.accessToken)),
        EncryptedStorage.setItem('provider', String(data.data.provider)),
        EncryptedStorage.setItem('chatToken', String(data.data.chatToken)),
      ]);

      return { ok: true };
    } catch (error: any) {
      throw error;
    }
  };
  const postCreateAccount = ({ email, password, code }: postCreateAccountProps) => {
    return authApi
      .post(ENDPOINTS.AUTH.CREATE_ACCOUNT, {
        email: email,
        password: password,
        code: code,
      })
      .then(response => {
        return true;
      })
      .catch(error => {
        console.log('[useAuthApi][postCreateAccount] error: ', error);
        console.log('[useAuthApi][postCreateAccount] error.res: ', error.response);
        if (error.response?.status === 400) {
          return false;
        }
        throw error;
      });
  };

  const postSignup = (nickname: string, password?: string, accessToken?: string) => {
    const body: { nickname: string; password?: string } = { nickname };
    // password가 존재하고 빈 문자열이 아닐 때만 추가
    if (password && password.trim() !== '') {
      body.password = password;
    }

    console.log('[postSignup] nickname:', nickname);
    console.log('[postSignup] password:', password);
    console.log('[postSignup] accessToken:', accessToken);
    console.log('[postSignup] body:', body);
    console.log('[postSignup] headers:', accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

    return authApiNoInterceptor
      .post(ENDPOINTS.AUTH.SIGNUP, body, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      .then(async ({ data }) => {
        await Promise.all([
          EncryptedStorage.setItem('accessToken', String(data.data.token.accessToken)),
          EncryptedStorage.setItem('refreshToken', String(data.data.token.refreshToken)),
          EncryptedStorage.setItem('provider', String(data.data.token.provider)),
        ]);
        return data.data;
      })
      .catch(error => {
        console.log(error);
        throw error;
      });
  };

  const postResetPassword = ({ email, code, newPassword }: postResetPasswordProps) => {
    return authApi
      .post(ENDPOINTS.AUTH.PASSWORD_RESET, { email: email, code: code, newPassword: newPassword })
      .then(() => {
        return true;
      })
      .catch(error => {
        throw error;
      });
  };

  // 기존 비밀번호 인증
  const postVerifyPassword = (currentPassword: string) => {
    return authApi
      .post(ENDPOINTS.AUTH.PASSWORD_VERIFY, { currentPassword })
      .then(() => {
        return true;
      })
      .catch(error => {
        throw error;
      });
  };

  // 비밀번호 변경
  const postChangePassword = (newPassword: string) => {
    return authApi
      .post(ENDPOINTS.AUTH.PASSWORD_CHANGE, { newPassword })
      .then(() => {
        return true;
      })
      .catch(error => {
        throw error;
      });
  };

  const postSettingPhone = async ({ name, userId, phone }: PostSettingPhoneProps) => {
    try {
      const { data } = await authApi.post(ENDPOINTS.AUTH.SETTING_PHONE, {
        name,
        userId,
        phone,
      });
      return { ok: true, data };
    } catch (error: any) {
      const status = error?.response?.status;
      const reason =
        error?.response?.data?.message || error?.response?.data?.reason || error?.response?.data?.errors || 'UNKNOWN';
      if (status === 409) {
        return { ok: false, reason };
      }
      throw error;
    }
  };

  const getFindEmail = async (phone: string): Promise<string | Provider> => {
    try {
      const data = await authApi.get(ENDPOINTS.AUTH.FIND_EMAIL, { params: { phone } });
      return String(data);
    } catch (error) {
      if (__DEV__) {
        console.log('[getFindEmail] error: ', error);
      }
      throw error;
    }
  };

  return {
    postEmailCheck,
    postEmailSend,
    getCheckNickname,
    postSignin,
    postVerifyCode,
    postLogout,
    clearAuthStorage,
    postAnonymous,
    postCreateAccount,
    postSignup,
    postResetPassword,
    postReissue,
    postVerifyPassword,
    postChangePassword,
    postSettingPhone,
    getFindEmail,
  };
};

export default useAuthApi;
