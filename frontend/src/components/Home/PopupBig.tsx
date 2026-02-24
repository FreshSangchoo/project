import { useState } from "react";
import { BannerProps } from "@utils/get-banner-image";

const PopupBig = ({ image, text, date }: BannerProps) => {
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked(!liked);
  };

  return (
    <div id="pop-up-big">
      <span className="like" onClick={toggleLike}>
        {/* {liked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
          >
            <g clipPath="url(#clip0_401_451)">
              <g filter="url(#filter0_d_401_451)">
                <path
                  d="M29.9998 12.25C30.002 13.2023 29.8153 14.1456 29.4505 15.0253C29.0858 15.905 28.5502 16.7036 27.8748 17.375L16.7123 28.7025C16.6193 28.797 16.5084 28.872 16.386 28.9232C16.2637 28.9745 16.1324 29.0008 15.9998 29.0008C15.8672 29.0008 15.7359 28.9745 15.6136 28.9232C15.4913 28.872 15.3804 28.797 15.2873 28.7025L4.12482 17.375C2.76393 16.0158 1.99873 14.1716 1.99756 12.2482C1.99639 10.3248 2.75934 8.47964 4.11857 7.11875C5.47781 5.75786 7.32198 4.99266 9.2454 4.99149C11.1688 4.99031 13.0139 5.75327 14.3748 7.1125L15.9998 8.63125L17.6361 7.1075C18.6516 6.09699 19.9438 5.41001 21.3495 5.13329C22.7552 4.85657 24.2113 5.00252 25.5341 5.55272C26.8569 6.10291 27.987 7.03268 28.7818 8.22465C29.5766 9.41662 30.0005 10.8173 29.9998 12.25Z"
                  fill="#fff"
                />
              </g>
            </g>
            <defs>
              <filter
                id="filter0_d_401_451"
                x="-2.00244"
                y="0.991486"
                width="36.0024"
                height="32.0094"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset />
                <feGaussianBlur stdDeviation="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_401_451"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_401_451"
                  result="shape"
                />
              </filter>
              <clipPath id="clip0_401_451">
                <rect width="32" height="32" fill="white" />
              </clipPath>
            </defs>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
          >
            <g clipPath="url(#clip0_411_447)">
              <g filter="url(#filter0_d_411_447)">
                <path
                  d="M28.2299 6.76622C26.7783 5.31894 24.813 4.50487 22.7632 4.50183C20.7134 4.49878 18.7457 5.30701 17.2899 6.74997L15.9999 7.94747L14.7099 6.74997C13.2545 5.29825 11.282 4.48412 9.22641 4.4867C7.17078 4.48928 5.20036 5.30835 3.74863 6.76372C2.2969 8.2191 1.48278 10.1916 1.48536 12.2472C1.48794 14.3028 2.30701 16.2732 3.76238 17.725L14.9311 29.0562C15.0707 29.198 15.2371 29.3105 15.4206 29.3873C15.604 29.4642 15.801 29.5037 15.9999 29.5037C16.1988 29.5037 16.3957 29.4642 16.5792 29.3873C16.7627 29.3105 16.9291 29.198 17.0686 29.0562L28.2299 17.7325C28.9499 17.0128 29.521 16.1583 29.9107 15.2178C30.3004 14.2773 30.501 13.2692 30.501 12.2512C30.501 11.2332 30.3004 10.2252 29.9107 9.28466C29.521 8.34417 28.9499 7.48967 28.2299 6.76997V6.76622ZM26.1049 15.615L15.9999 25.8625L5.89113 15.6062C5.00339 14.7148 4.50554 13.5076 4.50684 12.2495C4.50815 10.9914 5.00849 9.78527 5.89808 8.89568C6.78768 8.00609 7.99385 7.50574 9.25192 7.50444C10.51 7.50313 11.7172 8.00098 12.6086 8.88872C12.6211 8.90122 12.6336 8.91372 12.6474 8.92497L14.9774 11.095C15.255 11.3537 15.6204 11.4975 15.9999 11.4975C16.3794 11.4975 16.7447 11.3537 17.0224 11.095L19.3524 8.92497C19.3661 8.91372 19.3786 8.90122 19.3911 8.88872C19.8328 8.44814 20.3569 8.09886 20.9335 7.86082C21.5102 7.62279 22.128 7.50066 22.7519 7.50142C23.3757 7.50217 23.9933 7.62579 24.5694 7.86522C25.1454 8.10465 25.6687 8.4552 26.1093 8.89685C26.5498 9.3385 26.8991 9.86261 27.1372 10.4392C27.3752 11.0159 27.4973 11.6338 27.4966 12.2576C27.4958 12.8814 27.3722 13.499 27.1328 14.0751C26.8933 14.6511 26.5428 15.1744 26.1011 15.615H26.1049Z"
                  fill="white"
                />
              </g>
            </g>
            <defs>
              <filter
                id="filter0_d_411_447"
                x="-2.51465"
                y="0.486694"
                width="37.0156"
                height="33.017"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset />
                <feGaussianBlur stdDeviation="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_411_447"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_411_447"
                  result="shape"
                />
              </filter>
              <clipPath id="clip0_411_447">
                <rect width="32" height="32" fill="white" />
              </clipPath>
            </defs>
          </svg>
        )} */}
      </span>
      <div className="big-content">
        <img src={image} alt={text} />
        <div className="big-gradiant"></div>
        <p className="big-name">{text}</p>
        <p className="big-date">{date}</p>
      </div>
    </div>
  );
};

export default PopupBig;
