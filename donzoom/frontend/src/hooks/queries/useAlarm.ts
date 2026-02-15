import {getMyNotification} from '@/api/alarm';
import {UseQueryCustomOptions} from '@/types/common';
import {useQuery} from '@tanstack/react-query';

function useGetMyNotificationList(queryOptions?: UseQueryCustomOptions<any>) {
  return useQuery({
    queryKey: ['getMyNotificationList'],
    queryFn: getMyNotification,
    ...queryOptions,
  });
}

function useQuiz() {
  const getMyNotificationMutation = useGetMyNotificationList();

  return {getMyNotificationMutation};
}
export default useQuiz;
