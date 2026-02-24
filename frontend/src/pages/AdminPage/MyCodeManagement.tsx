import "@css/AdminPage/MyCodeManagement.css";
import CreateButton from "@components/CreateButton";
import { useEffect, useState } from "react";
import { Box, Modal } from "@mui/material";
import {
  getManagersData,
  createManagerData,
  deleteManagerData,
  getManagerDataById,
} from "@api/manager";
import { ManagerListProps, ManagerProps } from "@api/manager";

// 매니저 코드 관리 컴포넌트
const MyCodeManagement = () => {
  const [managers, setManagers] = useState<ManagerListProps[]>([]);
  const [modalType, setModalType] = useState<string | null>(null);
  const [current, setCurrent] = useState<ManagerProps | null>(null);

  // 매니저 목록 조회
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const data = await getManagersData();
        setManagers(data);
      } catch (error) {
        console.error("Failed to fetch managers:", error);
      }
    };

    fetchManagers();
  }, []);

  const openModal = async (type: string, managerTsid?: string) => {
    setModalType(type);

    if (type === "view" && managerTsid) {
      try {
        // getManagerDataById 함수 호출로 데이터를 가져와 setCurrent에 할당
        const data = await getManagerDataById(managerTsid);
        setCurrent({
          managerTsid: data.managerTsid,
          nickname: data.nickname,
          id: data.id,
          password: data.password,
          role: data.role,
          img: data.img,
        });
      } catch (error) {
        console.error("Failed to fetch manager details:", error);
      }
    } else if (type === "delete" && managerTsid) {
      const selectedManager = managers.find(
        (manager) => manager.managerTsid === managerTsid
      );

      if (selectedManager) {
        setCurrent({
          managerTsid: selectedManager.managerTsid,
          nickname: selectedManager.nickname,
          id: "", // 기본값 설정
          password: "", // 기본값 설정
          role: "", // 기본값 설정
          img: selectedManager.img,
        });
      } else {
        setCurrent(null);
      }
    }

    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalType(null);
    setCurrent(null);
    document.body.style.overflow = "unset";
  };

  // 매니저 코드 생성
  const handleCreateManager = async (
    managerData: Omit<ManagerProps, "managerTsid">
  ) => {
    try {
      const newManager = await createManagerData(managerData);

      // 생성 후 전체 목록을 다시 불러오기
      const updatedManagers = await getManagersData();
      setManagers(updatedManagers);

      closeModal();
    } catch (error) {
      console.error("Failed to create manager:", error);
    }
  };

  // 매니저 코드 삭제
  const handleDeleteManager = async (managerTsid: string) => {
    try {
      await deleteManagerData(managerTsid);

      // 삭제 후 상태에서 해당 매니저 제거
      setManagers((prev) =>
        prev.filter((manager) => manager.managerTsid !== managerTsid)
      );

      closeModal();
    } catch (error) {
      console.error("Failed to delete manager:", error);
    }
  };

  return (
    <div id="my-code-management">
      <h1>매니저 코드 관리</h1>
      <div className="manager-list">
        <table>
          <thead>
            <tr>
              <th>닉네임</th>
              <th>TS아이디</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager) => (
              <tr key={manager.managerTsid}>
                <td onClick={() => openModal("view", manager.managerTsid)}>
                  {manager.nickname}
                </td>
                <td onClick={() => openModal("view", manager.managerTsid)}>
                  {manager.managerTsid}
                </td>
                <td onClick={() => openModal("delete", manager.managerTsid)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M16.5 12C16.5 12.1989 16.421 12.3897 16.2803 12.5303C16.1397 12.671 15.9489 12.75 15.75 12.75H8.25C8.05109 12.75 7.86033 12.671 7.71967 12.5303C7.57902 12.3897 7.5 12.1989 7.5 12C7.5 11.8011 7.57902 11.6103 7.71967 11.4697C7.86033 11.329 8.05109 11.25 8.25 11.25H15.75C15.9489 11.25 16.1397 11.329 16.2803 11.4697C16.421 11.6103 16.5 11.8011 16.5 12ZM21.75 12C21.75 13.9284 21.1782 15.8134 20.1068 17.4168C19.0355 19.0202 17.5127 20.2699 15.7312 21.0078C13.9496 21.7458 11.9892 21.9389 10.0979 21.5627C8.20656 21.1865 6.46928 20.2579 5.10571 18.8943C3.74215 17.5307 2.81355 15.7934 2.43735 13.9021C2.06114 12.0108 2.25422 10.0504 2.99218 8.26884C3.73013 6.48726 4.97982 4.96451 6.58319 3.89317C8.18657 2.82183 10.0716 2.25 12 2.25C14.585 2.25273 17.0634 3.28084 18.8913 5.10872C20.7192 6.93661 21.7473 9.41498 21.75 12ZM20.25 12C20.25 10.3683 19.7661 8.77325 18.8596 7.41655C17.9531 6.05984 16.6646 5.00242 15.1571 4.37799C13.6497 3.75357 11.9909 3.59019 10.3905 3.90852C8.79017 4.22685 7.32016 5.01259 6.16637 6.16637C5.01259 7.32015 4.22685 8.79016 3.90853 10.3905C3.5902 11.9908 3.75358 13.6496 4.378 15.1571C5.00242 16.6646 6.05984 17.9531 7.41655 18.8596C8.77326 19.7661 10.3683 20.25 12 20.25C14.1873 20.2475 16.2843 19.3775 17.8309 17.8309C19.3775 16.2843 20.2475 14.1873 20.25 12Z"
                      fill="#D4145A"
                    />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CreateButton onClick={() => openModal("create")} />

      <Modal open={modalType !== null} onClose={closeModal}>
        <Box className="manager-modal">
          {/* 추가 모달 */}
          {modalType === "create" && (
            <div id="create-modal">
              <h2>매니저 코드 생성</h2>
              <div className="create-manager">
                <div>
                  <label htmlFor="">아이디</label>
                  <input
                    type="text"
                    placeholder="아이디 입력"
                    onChange={(e) => {
                      const newId = e.target.value;
                      setCurrent((prev) => ({
                        ...(prev as ManagerProps),
                        id: newId,
                      }));
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="">패스워드</label>
                  <input
                    type="password"
                    placeholder="패스워드 입력"
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setCurrent((prev) => ({
                        ...(prev as ManagerProps),
                        password: newPassword,
                      }));
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="">닉네임</label>
                  <input
                    type="text"
                    placeholder="닉네임 입력"
                    onChange={(e) => {
                      const newNickname = e.target.value;
                      setCurrent((prev) => ({
                        ...(prev as ManagerProps),
                        nickname: newNickname,
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="buttons">
                <button onClick={closeModal}>취소</button>
                <button
                  onClick={() => {
                    if (current) {
                      handleCreateManager({
                        id: current.id,
                        password: current.password,
                        nickname: current.nickname,
                        role: "ROLE_MANAGER", // 기본 역할 설정
                        img: "",
                      });
                    }
                  }}
                >
                  생성
                </button>
              </div>
            </div>
          )}

          {/* 삭제 모달 */}
          {modalType === "delete" && current && (
            <div id="delete-modal">
              <p>정말 삭제하시겠습니까?</p>
              <div className="buttons">
                <button onClick={closeModal}>취소</button>
                <button
                  onClick={() => handleDeleteManager(current.managerTsid)}
                >
                  삭제
                </button>
              </div>
            </div>
          )}

          {/* 조회 모달 */}
          {modalType === "view" && current && (
            <div id="view-modal">
              <h2>매니저 정보</h2>
              <h3>TS아이디</h3>
              <p className="id">{current.managerTsid}</p>
              <h3>닉네임</h3>
              <p className="nickname">{current.nickname}</p>
              <h3>아이디</h3>
              <p className="id">{current.id}</p>
              <h3>패스워드</h3>
              <p className="nickname">{current.password}</p>
            </div>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default MyCodeManagement;
