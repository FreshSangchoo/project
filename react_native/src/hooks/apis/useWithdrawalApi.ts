import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';

export interface postWithdrawalProps {
  withdrawalReasonId: number;
  customReason: string;
}

export const useWithdrawalApi = () => {
  const { withdrawalApi } = useApi();

  const postWithdrawal = ({ withdrawalReasonId, customReason }: postWithdrawalProps) => {
    return withdrawalApi
      .post(ENDPOINTS.WITHDRAWAL.POST, { withdrawalReasonId, customReason })
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  const getWithdrawalReasons = () => {
    return withdrawalApi
      .get(ENDPOINTS.WITHDRAWAL.GET)
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  return {
    postWithdrawal,
    getWithdrawalReasons,
  };
};
