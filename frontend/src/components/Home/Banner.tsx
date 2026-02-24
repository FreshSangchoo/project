import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { BannerProps } from "@utils/get-banner-image";

interface Banners {
  banners: BannerProps[];
}

const Banner = ({banners} : Banners) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const formatNumber = (number: number) => number.toString().padStart(2, '0');

  const settings = {
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    beforeChange: (next: number) => setCurrentIndex(next),
  };

  return (
    <div id="banner">
      <span id="banner-count">
        {formatNumber(currentIndex + 1)} / {formatNumber(banners.length)}
      </span>
      <Slider {...settings}>
        {banners.map((banner, index) => (
          <div key={index} className="banner-content">
            <img src={banner.image} alt={banner.text} />
            <div className="banner-gradiant"></div>
            <p className="banner-name">{banner.text}</p>
            <p className="banner-date">{banner.date}</p>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Banner;
