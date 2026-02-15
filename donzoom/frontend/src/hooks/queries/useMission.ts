import {
  MissionList,
  deleteMission,
  getMissions,
  makeMission,
  makeNewMission,
  modifyMission,
  newMission,
} from '@/api/mission';
import {UseMutationCustomOptions, UseQueryCustomOptions} from '@/types/common';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Mission} from '@/api/mission';

// 미션조회
function useGetMissions(
  userId: number,
  status: string,
  queryOptions?: UseQueryCustomOptions<MissionList>,
) {
  return useQuery({
    queryKey: ['getMissions', status, userId],
    queryFn: () => getMissions(userId, status),
    enabled: !!userId,
    ...queryOptions,
  });
}

function usePostMission(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: makeNewMission,
    ...mutationOptions,
  });
}


function useModifyMission(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: modifyMission,
    ...mutationOptions,
  });
}

function useDeleteMission(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: deleteMission,
    ...mutationOptions,
  });
}

function useMission() {
  return {useGetMissions, usePostMission, useModifyMission, useDeleteMission};
}
export default useMission;
