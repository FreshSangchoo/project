import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserProps } from "@interface/users";
import { checkNickname, getUserData, updateUserData } from "@api/users";
import Header from "@components/common/Header";
import Menu from "@components/common/Menu";
import useAuthStore from "@store/useAuthStore";
import { useTokenManagement } from "@hooks/useTokenManagement";

const UserUpdate: React.FC = () => {
  const [user, setUser] = useState<UserProps>({
    userTsid: "",
    nickname: "",
    email: "",
    phoneNumber: "",
    userCategories: [],
    userConsents: {
      marketingConsent: false,
      marketingUpdatedAt: "",
      servicePushConsent: false,
      serviceUpdatedAt: "",
    },
    role: "",
    img: null,
  });

  const [originalNickname, setOriginalNickname] = useState<string>("");
  const [nicknameMsg, setNicknameMsg] = useState<string>("");
  const [nicknameCheck, setNicknameCheck] = useState<boolean>(false);
  const { userTsid, userRole } = useAuthStore();
  const { token, saveToken } = useTokenManagement();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        console.log("Fetched user data:", data);
        if (data) {
          setOriginalNickname(data.nickname); // 원래 닉네임 저장
          setUser((prevUser) => {
            const updatedUser = {
              ...prevUser,
              ...data,
              userConsents: {
                ...prevUser.userConsents,
                ...data.userConsents,
              },
              userCategories: data.userCategories
                ? data.userCategories.map((cate: any) => ({
                    name: cate.name,
                  }))
                : prevUser.userCategories,
              role: userRole ?? prevUser.role,
            };
            console.log("Updated user state:", updatedUser);
            return updatedUser;
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userTsid, userRole]);

  const userChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;

    setUser((prevUser) => {
      if (name === "nickname") {
        return {
          ...prevUser,
          nickname: value, // 닉네임 필드를 직접 업데이트
        };
      } else if (name === "marketingConsent" || name === "servicePushConsent") {
        return {
          ...prevUser,
          userConsents: {
            ...prevUser.userConsents,
            [name]: type === "checkbox" ? checked : value,
            [`${name}UpdatedAt`]: new Date().toISOString(),
          },
        };
      } else {
        return {
          ...prevUser,
          [name]: value, // 기타 다른 일반 input 필드의 경우 값을 직접 설정
        };
      }
    });
  };

  const handleNicknameCheck = async () => {
    if (user?.nickname) {
      if (user.nickname === originalNickname) {
        setNicknameMsg("사용 가능한 닉네임입니다.");
        setNicknameCheck(true);
        return;
      }

      try {
        const result = await checkNickname(user.nickname);
        if (result) {
          setNicknameMsg("사용 가능한 닉네임입니다.");
          setNicknameCheck(true);
        } else {
          setNicknameMsg("중복된 닉네임입니다.");
          setNicknameCheck(false);
        }
      } catch (error) {
        setNicknameMsg("중복된 닉네임입니다.");
        setNicknameCheck(false);
      }
    }
  };

  const handleImageClick = () => {
    const fileInput = document.getElementById(
      "profileImageInput"
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUser((prevUser) => ({
        ...prevUser,
        img: file,
      }));
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setUser((prevUser) => {
      const categoryExists = prevUser.userCategories.some(
        (cat) => cat.name === categoryName // 기존 카테고리의 이름과 비교
      );

      const newCategories = categoryExists
        ? prevUser.userCategories.filter(
            (cat) => cat.name !== categoryName // 카테고리에서 삭제
          )
        : prevUser.userCategories.length < 3
        ? [...prevUser.userCategories, { name: categoryName }] // 새로운 카테고리 추가
        : prevUser.userCategories;

      return {
        ...prevUser,
        userCategories: newCategories,
      };
    });
  };

  const submit = async () => {
    // 닉네임이 변경된 경우에만 중복 체크를 요구
    if (user.nickname !== originalNickname && !nicknameCheck) {
      setNicknameMsg("닉네임 중복 확인을 해주세요.");
      return;
    }

    if (user) {
      console.log("User data exists:", user);
      try {
        const formData = new FormData();

        const marketingUpdatedAt = user.userConsents.marketingUpdatedAt
          ? new Date(user.userConsents.marketingUpdatedAt)
              .toISOString()
              .slice(0, 19)
          : null;
        const serviceUpdatedAt = user.userConsents.serviceUpdatedAt
          ? new Date(user.userConsents.serviceUpdatedAt)
              .toISOString()
              .slice(0, 19)
          : null;

        const userData = {
          userTsid: user.userTsid,
          nickname: user.nickname,
          email: user.email,
          phoneNumber: user.phoneNumber,
          userCategories: user.userCategories,
          userConsents: {
            marketingConsent: user.userConsents.marketingConsent,
            marketingUpdatedAt: marketingUpdatedAt || "",
            servicePushConsent: user.userConsents.servicePushConsent,
            serviceUpdatedAt: serviceUpdatedAt || "",
          },
          role: user.role,
        };

        formData.append("userData", JSON.stringify(userData));

        if (user.img) {
          formData.append("img", user.img);
        }

        const updatedData = await updateUserData(formData);

        // 회원 정보가 성공적으로 업데이트된 후 토큰 저장
        if (user && (user.userConsents.marketingConsent || user.userConsents.servicePushConsent)) {
          await saveToken(user.userTsid);
        }

        setUser((prevUser) => ({
          ...prevUser,
          ...updatedData,
          userConsents: {
            ...prevUser.userConsents,
            ...updatedData.userConsents,
          },
        }));

        navigate("/mypage");
      } catch (error) {
        console.error("Error updating user data:", error);
      }
    }
  };

  return (
    <>
      <Header leftIcon="취소" rightIcon="완료" onRightClick={submit} />

      <div id="user-update">
        <div className="update-image">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M19.5 4.875H17.1019L15.9375 3.12563C15.8346 2.97138 15.6952 2.84497 15.5316 2.75763C15.368 2.67029 15.1854 2.62473 15 2.625H9C8.81458 2.62473 8.63197 2.67029 8.46841 2.75763C8.30484 2.84497 8.16541 2.97138 8.0625 3.12563L6.89719 4.875H4.5C3.80381 4.875 3.13613 5.15156 2.64384 5.64385C2.15156 6.13613 1.875 6.80381 1.875 7.5V18C1.875 18.6962 2.15156 19.3639 2.64384 19.8562C3.13613 20.3484 3.80381 20.625 4.5 20.625H19.5C19.8447 20.625 20.1861 20.5571 20.5045 20.4252C20.823 20.2933 21.1124 20.0999 21.3562 19.8562C21.5999 19.6124 21.7933 19.323 21.9252 19.0045C22.0571 18.6861 22.125 18.3447 22.125 18V7.5C22.125 7.15528 22.0571 6.81394 21.9252 6.49546C21.7933 6.17698 21.5999 5.8876 21.3562 5.64385C21.1124 5.40009 20.823 5.20674 20.5045 5.07482C20.1861 4.9429 19.8447 4.875 19.5 4.875ZM19.875 18C19.875 18.0995 19.8355 18.1948 19.7652 18.2652C19.6948 18.3355 19.5995 18.375 19.5 18.375H4.5C4.40054 18.375 4.30516 18.3355 4.23484 18.2652C4.16451 18.1948 4.125 18.0995 4.125 18V7.5C4.125 7.40055 4.16451 7.30516 4.23484 7.23484C4.30516 7.16451 4.40054 7.125 4.5 7.125H7.5C7.68542 7.12528 7.86803 7.07972 8.03159 6.99237C8.19516 6.90503 8.33459 6.77862 8.4375 6.62438L9.60187 4.875H14.3972L15.5625 6.62438C15.6654 6.77862 15.8048 6.90503 15.9684 6.99237C16.132 7.07972 16.3146 7.12528 16.5 7.125H19.5C19.5995 7.125 19.6948 7.16451 19.7652 7.23484C19.8355 7.30516 19.875 7.40055 19.875 7.5V18ZM12 7.875C11.11 7.875 10.24 8.13892 9.49993 8.63339C8.75991 9.12785 8.18314 9.83066 7.84254 10.6529C7.50195 11.4752 7.41283 12.38 7.58647 13.2529C7.7601 14.1258 8.18868 14.9276 8.81802 15.557C9.44736 16.1863 10.2492 16.6149 11.1221 16.7885C11.995 16.9622 12.8998 16.8731 13.7221 16.5325C14.5443 16.1919 15.2471 15.6151 15.7416 14.8751C16.2361 14.135 16.5 13.265 16.5 12.375C16.4988 11.1819 16.0243 10.038 15.1806 9.19439C14.337 8.35075 13.1931 7.87624 12 7.875ZM12 14.625C11.555 14.625 11.12 14.493 10.75 14.2458C10.38 13.9986 10.0916 13.6472 9.92127 13.236C9.75097 12.8249 9.70642 12.3725 9.79323 11.936C9.88005 11.4996 10.0943 11.0987 10.409 10.784C10.7237 10.4693 11.1246 10.2551 11.561 10.1682C11.9975 10.0814 12.4499 10.126 12.861 10.2963C13.2722 10.4666 13.6236 10.755 13.8708 11.125C14.118 11.495 14.25 11.93 14.25 12.375C14.25 12.9717 14.0129 13.544 13.591 13.966C13.169 14.3879 12.5967 14.625 12 14.625Z"
              fill="#D4145A"
            />
          </svg>
          <div className="profile-black" onClick={handleImageClick}></div>
          <img
            src={
              user.img instanceof File
                ? URL.createObjectURL(user.img)
                : user.img
                ? `http://localhost/${user.img}`
                : ""
            }
            alt="profile"
            onClick={handleImageClick}
          />
          <input
            type="file"
            id="profileImageInput"
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <div className="update-profile">
          <div className="update-nickname">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={user.nickname}
              onChange={userChange}
            />
            <button onClick={handleNicknameCheck}>중복확인</button>
          </div>
          {nicknameMsg && (
            <p
              className={`nickname-check ${
                nicknameCheck ? "success" : "error"
              }`}
            >
              {nicknameMsg}
            </p>
          )}
          <div className="update-email">
            <label htmlFor="email">게정 정보</label>
            <input
              type="text"
              id="email"
              name="email"
              value={user.email}
              onChange={userChange}
              readOnly
            />
          </div>
          <div className="update-phone-number">
            <label htmlFor="phone-number">연락처</label>
            <input
              type="text"
              id="phone-number"
              name="phoneNumber"
              value={user.phoneNumber}
              onChange={userChange}
              readOnly
            />
          </div>
          <div className="update-category">
            <h3>선호하는 카테고리</h3>
            {[
              "뷰티",
              "패션",
              "음식/음료",
              "캐릭터",
              "리빙/금융",
              "연예",
              "게임",
              "가전/디지털",
              "콘텐츠",
              "취미/여가",
            ].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={
                  user.userCategories.some(
                    (cat) => cat.name === category // 기존 카테고리와 비교
                  )
                    ? "selected"
                    : ""
                }
                disabled={
                  user.userCategories.length >= 3 &&
                  !user.userCategories.some((cat) => cat.name === category)
                }
              >
                {category}
              </button>
            ))}
          </div>
          <div className="update-agree">
            <h3>마케팅 수신 동의</h3>
            <div className="update-marketing">
              <input
                type="checkbox"
                id="marketing"
                name="marketingConsent"
                checked={user.userConsents.marketingConsent}
                onChange={userChange}
              />
              <label htmlFor="marketing">마케팅 수신 동의</label>
            </div>
            <p>(동의: {user.userConsents.marketingUpdatedAt})</p>

            <div className="update-push">
              <input
                type="checkbox"
                id="push"
                name="servicePushConsent"
                checked={user.userConsents.servicePushConsent}
                onChange={userChange}
              />
              <label htmlFor="push">이벤트성 푸쉬 알림 수신 동의</label>
            </div>
            <p>(동의: {user.userConsents.serviceUpdatedAt})</p>
          </div>
        </div>
      </div>

      <Menu />
    </>
  );
};

export default UserUpdate;
