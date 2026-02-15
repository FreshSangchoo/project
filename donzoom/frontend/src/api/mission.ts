import axiosInstance from './axios';

type Mission = {
  missionId:number;
  contents: string;
  reward: number;
  status: string;
  dueDate: Date;
};

type MissionList = {
  missions: Mission[];
};

const getMissions = async (
  userId: number,
  status: string,
): Promise<MissionList> => {
  try {
    const {data} = await axiosInstance.get<MissionList>(
      `/mission/${userId}/${status}`,
    );
    console.log('미션', {status}, '상태 조회:', data);
    return data;
  } catch (error) {
    // console.log('Error: 상태조회', status,error);
    return {missions: []}; // 오류 시 빈 missions 배열을 가진 객체 반환
  }
};


type makeMission = {
  childId: number|null;
  contents: string|null;
  reward: number|null;
  dueDate: Date|string|null;
};


// 미션생성
const makeNewMission = async ({
  childId,
  contents,
  reward,
  dueDate,
}: makeMission) => {
  const {data} = await axiosInstance.post('/mission', {
    childId,
    contents,
    reward,
    dueDate,
  });
  console.log('미션생성', data);
  return data;
};

type newMission = {
  missionId: number;
  contents?: string;
  reward?: number;
  status?: string;
  dueDate?: Date|string;
};


// 미션수정
const modifyMission = async (params:newMission) => {
    try{
        const {missionId, ...otherData} = params
        const {data} = await axiosInstance.patch(`/mission/${missionId}`, {
            otherData
        });
    }
    catch (error){
        console.log('미션수정에러',error)
    }
};

// 미션삭제
const deleteMission = async (missionId: number) => {
  try{
    const {data} = await axiosInstance.delete(`/mission/${missionId}`);
  }
  catch{
    console.log('미션삭제axios에러')
  }
};

export {getMissions, makeNewMission, modifyMission, deleteMission};
export type {Mission,newMission,makeMission,MissionList};
