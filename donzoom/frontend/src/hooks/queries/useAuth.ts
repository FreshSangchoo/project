import {
  ResponseProfile,
  getProfile,
  logout,
  postAutoLogin,
  postChildAdd,
  postLogin,
  postProfileImage,
  postSetRelation,
  postSignup,
} from '@/api/auth';
import queryClient from '@/api/queryClient';
import {queryKeys, storageKeys} from '@/constants/keys';
import {UseMutationCustomOptions, UseQueryCustomOptions} from '@/types/common';
import {Child} from '@/types/domain';
import {removeEncryptedStorage, setEncryptStorage} from '@/utils';
import {removeHeader, setHeader} from '@/utils/header';
import {queryOptions, useMutation, useQuery} from '@tanstack/react-query';

function useSignup(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postSignup,
    ...mutationOptions,
  });
}

function useLogin(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postLogin,
    onSuccess: authorization => {
      setEncryptStorage(storageKeys.REFRESH_TOKEN, authorization);
      setHeader('Authorization', `${authorization}`);
    },
    onSettled: () => {
      queryClient.refetchQueries({
        queryKey: [queryKeys.AUTH, queryKeys.AUTH.GET_ACCESS_TOKEN],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.AUTH, queryKeys.AUTH.GET_PROFILE],
      });
    },
    ...mutationOptions,
  });
}

function useGetProfile(queryOptions?: UseQueryCustomOptions<ResponseProfile>) {
  return useQuery({
    queryKey: [queryKeys.AUTH, queryKeys.AUTH.GET_PROFILE],
    queryFn: getProfile,
    ...queryOptions,
  });
}

function useGetChildren() {
  const {data: profile} = useGetProfile();
  // console.log('프로필',profile?.children)
  return {
    children: profile?.children ?? [],
  };
}

function useLogout(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      removeHeader('Authorization');
      removeEncryptedStorage(storageKeys.REFRESH_TOKEN);
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: [queryKeys.AUTH]});
    },
    ...mutationOptions,
  });
}

function useAutoLogin(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postAutoLogin,
    ...mutationOptions,
  });
}

function useProfileImage(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postProfileImage,
    ...mutationOptions,
  });
}

function useChildAdd(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postChildAdd,
    ...mutationOptions,
  });
}

function useSetRelation(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postSetRelation,
    ...mutationOptions,
  });
}

function useAuth() {
  const signupMutation = useSignup();
  const getProfileQuery = useGetProfile();
  const isLogin = getProfileQuery.isSuccess;
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const children = useGetChildren();
  const autoLoginMutation = useAutoLogin();
  const profileImageMutation = useProfileImage();
  const childAddMutation = useChildAdd();
  const setRelationMutation = useSetRelation();

  return {
    signupMutation,
    getProfileQuery,
    isLogin,
    loginMutation,
    logoutMutation,
    autoLoginMutation,
    profileImageMutation,
    childAddMutation,
    children,
    setRelationMutation,
  };
}

export default useAuth;
