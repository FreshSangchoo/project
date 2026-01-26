import { ENDPOINTS, DANAL_CPID } from '@/config';
import useApi from '@/hooks/apis/useApi';
import axios from 'axios';

type DanalConfirmResult = {
  RETURNCODE: string;
  RETURNMSG: string;
  TID: string;
  PHONE?: string;
  USERID?: string;
  NAME?: string;
  CI?: string;
  DI?: string;
};

const useDanalApi = () => {
  const { danalApi } = useApi();

  // TID 발급
  const postDanalVerify = async (): Promise<string> => {
    try {
      const { data } = await danalApi.post(ENDPOINTS.DANAL.VERIFY, {});
      if (__DEV__) console.log('[VERIFY] TID =', data);
      return data;
    } catch (e) {
      if (__DEV__) console.log('[postDanalVerify error]', e);
      return '';
    }
  };

  // 다날 WebAuth 시작 HTML
  const postDanalServer = async (TID: string): Promise<string> => {
    try {
      const { data } = await axios.post(
        'https://wauth.teledit.com/Danal/WebAuth/Mobile/Start.php',
        { TID, IsCharSet: 'UTF-8' },
        {
          responseType: 'text',
          transformResponse: v => v,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html',
          },
        },
      );
      if (__DEV__) console.log('[WebAuth HTML] len =', String(data || '').length);
      return data;
    } catch (e) {
      if (__DEV__) console.log('[postDanalServer error]', e);
      return '';
    }
  };

  const postDanalConfirm = async (tid: string): Promise<DanalConfirmResult | null> => {
    try {
      const params = new URLSearchParams();
      params.append('TXTYPE', 'CONFIRM');
      params.append('TID', tid);
      params.append('CPID', DANAL_CPID!);

      const { data } = await axios.post('https://uas.teledit.com/uas/', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        transformResponse: v => v,
        responseType: 'text',
      });

      const result: any = {};
      String(data || '')
        .split('&')
        .forEach((pair: string) => {
          const [k, v] = pair.split('=', 2);
          if (k) result[k] = v ?? '';
        });

      if (__DEV__) console.log('[CONFIRM RESULT]', result);
      return result as DanalConfirmResult;
    } catch (e) {
      if (__DEV__) console.log('[postDanalConfirm error]', e);
      return null;
    }
  };

  return { postDanalVerify, postDanalServer, postDanalConfirm };
};

export default useDanalApi;
