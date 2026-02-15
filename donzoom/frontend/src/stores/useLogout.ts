import useAuth from '@/hooks/queries/useAuth';
import {useQueryClient} from '@tanstack/react-query';
import {useSignupStore} from './useAuthStore';
import useTransferStore from './useTransferStore';
import {useNavigation} from '@react-navigation/native';

const useLogout = () => {
  const navigation = useNavigation() as any;
  const queryClient = useQueryClient();
  const {logoutMutation, isLogin} = useAuth();
  const {reset: resetSignupStore} = useSignupStore();
  const {reset: resetTransferStore} = useTransferStore();

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync(null);
      queryClient.clear();
      resetSignupStore();
      resetTransferStore();
      console.log('isLogin:', isLogin);
      // navigation.navigate('Login');
      console.log('로그아웃 성공: 모든 스토어가 초기화되었습니다.');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };
  return logout;
};

export default useLogout;
