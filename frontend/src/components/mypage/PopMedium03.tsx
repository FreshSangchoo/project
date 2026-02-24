import { BannerProps } from "@utils/get-banner-image";

const PopMedium03 = ({image, text, date, children} : BannerProps & {children: React.ReactNode}) => {
  return (
    <div id="pop-medium-03">
      <div className="pop-image-03">
        <img src={image} alt={text} />
      </div>
      <div className="pop-detail-03">
        <p className="pop-name-03">{text}</p>
        <p className="pop-date-03">{date}</p>
        {children}
      </div>
    </div>
  );
}

export default PopMedium03;