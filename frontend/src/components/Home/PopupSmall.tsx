import { useState } from "react";
import { BannerProps } from "@utils/get-banner-image";

const PopupSmall = ({ image, text, date }: BannerProps) => {
  const [liked, setLiked] = useState(false);
  const toggleLike = () => {
    setLiked(!liked);
  };

  return (
    <>
      <span className="like" onClick={toggleLike}>
        {/* {liked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <g clipPath="url(#clip0_411_449)">
              <g filter="url(#filter0_d_411_449)">
                <path
                  d="M22.5002 9.18748C22.5018 9.90171 22.3618 10.6092 22.0882 11.2689C21.8147 11.9287 21.413 12.5277 20.9065 13.0312L12.5346 21.5269C12.4648 21.5977 12.3816 21.654 12.2899 21.6924C12.1982 21.7308 12.0997 21.7506 12.0002 21.7506C11.9008 21.7506 11.8023 21.7308 11.7106 21.6924C11.6188 21.654 11.5356 21.5977 11.4659 21.5269L3.09398 13.0312C2.07332 12.0118 1.49942 10.6287 1.49854 9.18611C1.49766 7.74354 2.06987 6.35971 3.0893 5.33904C4.10872 4.31837 5.49185 3.74447 6.93442 3.74359C8.37698 3.74271 9.76081 4.31493 10.7815 5.33435L12.0002 6.47342L13.2274 5.3306C13.9891 4.57272 14.9582 4.05748 16.0125 3.84994C17.0667 3.64241 18.1589 3.75187 19.1509 4.16452C20.143 4.57716 20.9906 5.27449 21.5867 6.16847C22.1828 7.06244 22.5007 8.11299 22.5002 9.18748Z"
                  fill="white"
                />
              </g>
            </g>
            <defs>
              <filter
                id="filter0_d_411_449"
                x="-2.50146"
                y="-0.256409"
                width="29.002"
                height="26.007"
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
                  result="effect1_dropShadow_411_449"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_411_449"
                  result="shape"
                />
              </filter>
              <clipPath id="clip0_411_449">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <g clipPath="url(#clip0_411_447)">
              <g filter="url(#filter0_d_411_447)">
                <path
                  d="M21.1727 5.0747C20.084 3.98924 18.61 3.37868 17.0727 3.3764C15.5353 3.37412 14.0595 3.98029 12.9677 5.06251L12.0002 5.96064L11.0327 5.06251C9.94112 3.97371 8.46178 3.36312 6.92005 3.36506C5.37833 3.36699 3.90051 3.98129 2.81172 5.07282C1.72292 6.16436 1.11233 7.6437 1.11426 9.18543C1.1162 10.7272 1.7305 12.205 2.82203 13.2938L11.1986 21.7922C11.3033 21.8985 11.428 21.9829 11.5657 22.0405C11.7033 22.0981 11.851 22.1278 12.0002 22.1278C12.1493 22.1278 12.297 22.0981 12.4347 22.0405C12.5723 21.9829 12.697 21.8985 12.8017 21.7922L21.1727 13.2994C21.7127 12.7596 22.141 12.1187 22.4333 11.4134C22.7256 10.708 22.876 9.95197 22.876 9.18845C22.876 8.42493 22.7256 7.66889 22.4333 6.96353C22.141 6.25816 21.7127 5.61728 21.1727 5.07751V5.0747ZM19.5789 11.7113L12.0002 19.3969L4.41859 11.7047C3.75278 11.0361 3.3794 10.1307 3.38038 9.18717C3.38135 8.24361 3.75661 7.33898 4.42381 6.67179C5.091 6.00459 5.99563 5.62934 6.93918 5.62836C7.88274 5.62738 8.78814 6.00076 9.45672 6.66657C9.46609 6.67595 9.47547 6.68532 9.48578 6.69376L11.2333 8.32126C11.4415 8.51527 11.7155 8.62314 12.0002 8.62314C12.2848 8.62314 12.5588 8.51527 12.767 8.32126L14.5145 6.69376C14.5248 6.68532 14.5342 6.67595 14.5436 6.66657C14.8748 6.33614 15.2679 6.07417 15.7004 5.89565C16.1329 5.71712 16.5963 5.62553 17.0642 5.62609C17.532 5.62666 17.9952 5.71938 18.4273 5.89895C18.8593 6.07852 19.2517 6.34143 19.5822 6.67267C19.9126 7.00391 20.1746 7.39699 20.3531 7.82946C20.5316 8.26194 20.6232 8.72535 20.6227 9.19323C20.6221 9.6611 20.5294 10.1243 20.3498 10.5563C20.1702 10.9884 19.9073 11.3808 19.5761 11.7113H19.5789Z"
                  fill="white"
                />
              </g>
            </g>
            <defs>
              <filter
                id="filter0_d_411_447"
                x="-2.88574"
                y="-0.634949"
                width="29.7617"
                height="26.7628"
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
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        )} */}
      </span>
      <div className="small-content">
        <img src={image} alt={text} />
        <div className="small-gradiant"></div>
        <p className="small-name">{text}</p>
        <p className="small-date">{date}</p>
      </div>
    </>
  );
};

export default PopupSmall;
