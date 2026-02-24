import "@css/Menu.css";
import { NavLink } from "react-router-dom";

const Menu = () => {

  return (
    <div id="menu">
      <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
        <div className="home">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
          >
            <g clipPath="url(#clip0_350_504)">
              <path
                className="icon-path"
                d="M13.5703 27.9603V19.9603H19.5703V27.9603H27.5703V15.9603C27.5704 15.8289 27.5446 15.6988 27.4944 15.5774C27.4443 15.456 27.3706 15.3457 27.2778 15.2528L17.2778 5.25276C17.1849 5.15978 17.0747 5.08602 16.9533 5.0357C16.8319 4.98538 16.7017 4.95947 16.5703 4.95947C16.4389 4.95947 16.3088 4.98538 16.1874 5.0357C16.066 5.08602 15.9557 5.15978 15.8628 5.25276L5.86281 15.2528C5.76998 15.3457 5.69636 15.456 5.64618 15.5774C5.59599 15.6988 5.57021 15.8289 5.57031 15.9603V27.9603H13.5703Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_350_504">
                <rect
                  width="32"
                  height="32"
                  fill="white"
                  transform="translate(0.570312 0.960205)"
                />
              </clipPath>
            </defs>
          </svg>
          <span>홈</span>
        </div>
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => (isActive ? "active" : "")}>
        <div className="calendar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
          >
            <g clipPath="url(#clip0_360_534)">
              <path
                className="icon-path"
                d="M26.5322 5.14868H6.53223C5.97994 5.14868 5.53223 5.5964 5.53223 6.14868V26.1487C5.53223 26.701 5.97994 27.1487 6.53223 27.1487H26.5322C27.0845 27.1487 27.5322 26.701 27.5322 26.1487V6.14868C27.5322 5.5964 27.0845 5.14868 26.5322 5.14868Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M22.5322 3.14868V7.14868"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M10.5322 3.14868V7.14868"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M5.53223 11.1487H27.5322"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_360_534">
                <rect
                  width="32"
                  height="32"
                  fill="white"
                  transform="translate(0.532227 0.148682)"
                />
              </clipPath>
            </defs>
          </svg>
          <span>캘린더</span>
        </div>
      </NavLink>
      <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")}>
        <div className="map">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
          >
            <g clipPath="url(#clip0_350_518)">
              <path
                className="icon-path"
                d="M16.6714 17.0817C18.8805 17.0817 20.6714 15.2908 20.6714 13.0817C20.6714 10.8725 18.8805 9.08167 16.6714 9.08167C14.4622 9.08167 12.6714 10.8725 12.6714 13.0817C12.6714 15.2908 14.4622 17.0817 16.6714 17.0817Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M26.6714 13.0817C26.6714 22.0817 16.6714 29.0817 16.6714 29.0817C16.6714 29.0817 6.67139 22.0817 6.67139 13.0817C6.67139 10.4295 7.72496 7.88596 9.60032 6.0106C11.4757 4.13523 14.0192 3.08167 16.6714 3.08167C19.3236 3.08167 21.8671 4.13523 23.7425 6.0106C25.6178 7.88596 26.6714 10.4295 26.6714 13.0817Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_350_518">
                <rect
                  width="32"
                  height="32"
                  fill="white"
                  transform="translate(0.671387 0.081665)"
                />
              </clipPath>
            </defs>
          </svg>
          <span>내주변</span>
        </div>
      </NavLink>
      <NavLink to="/review" className={({ isActive }) => (isActive ? "active" : "")}>
        <div className="review">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
          >
            <g clipPath="url(#clip0_350_522)">
              <path
                className="icon-path"
                d="M12.9556 19.6656H20.9556"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M12.9556 15.6656H20.9556"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M20.9556 5.66565H25.9556C26.2208 5.66565 26.4751 5.77101 26.6627 5.95854C26.8502 6.14608 26.9556 6.40043 26.9556 6.66565V27.6656C26.9556 27.9309 26.8502 28.1852 26.6627 28.3728C26.4751 28.5603 26.2208 28.6656 25.9556 28.6656H7.95557C7.69035 28.6656 7.436 28.5603 7.24846 28.3728C7.06092 28.1852 6.95557 27.9309 6.95557 27.6656V6.66565C6.95557 6.40043 7.06092 6.14608 7.24846 5.95854C7.436 5.77101 7.69035 5.66565 7.95557 5.66565H12.9556"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M11.9556 9.66565V8.66565C11.9556 7.33957 12.4824 6.0678 13.42 5.13012C14.3577 4.19243 15.6295 3.66565 16.9556 3.66565C18.2816 3.66565 19.5534 4.19243 20.4911 5.13012C21.4288 6.0678 21.9556 7.33957 21.9556 8.66565V9.66565H11.9556Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_350_522">
                <rect
                  width="32"
                  height="32"
                  fill="white"
                  transform="translate(0.955566 0.665649)"
                />
              </clipPath>
            </defs>
          </svg>
          <span>후기</span>
        </div>
      </NavLink>
      <NavLink to="/mypage" className={({ isActive }) => (isActive ? "active" : "")}>
        <div className="mypage">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
          >
            <g clipPath="url(#clip0_350_528)">
              <path
                className="icon-path"
                d="M8.43408 25.344C9.18647 23.862 10.3345 22.6173 11.751 21.7479C13.1675 20.8784 14.7971 20.4182 16.4591 20.4182C18.1211 20.4182 19.7507 20.8784 21.1672 21.7479C22.5836 22.6173 23.7317 23.862 24.4841 25.344"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M16.459 28.4227C23.0864 28.4227 28.459 23.0501 28.459 16.4227C28.459 9.79531 23.0864 4.42273 16.459 4.42273C9.83157 4.42273 4.45898 9.79531 4.45898 16.4227C4.45898 23.0501 9.83157 28.4227 16.459 28.4227Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="icon-path"
                d="M16.459 20.4227C19.2204 20.4227 21.459 18.1842 21.459 15.4227C21.459 12.6613 19.2204 10.4227 16.459 10.4227C13.6976 10.4227 11.459 12.6613 11.459 15.4227C11.459 18.1842 13.6976 20.4227 16.459 20.4227Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_350_528">
                <rect
                  width="32"
                  height="32"
                  fill="white"
                  transform="translate(0.458984 0.422729)"
                />
              </clipPath>
            </defs>
          </svg>
          <span>마이페이지</span>
        </div>
      </NavLink>
    </div>
  );
};

export default Menu;
