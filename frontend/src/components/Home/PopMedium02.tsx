interface PopMedium02Props {
  image: string;
  text: string;
  date: string;
  daysDiff: number;
}

const PopMedium02 = ({ image, text, date, daysDiff }: PopMedium02Props) => {
  return (
    <div id="pop-up-medium">
      <div className="pop-open">
        <h2>오픈</h2>
        <h2>{daysDiff > 0 ? `D-${daysDiff}` : '완료'}</h2>
      </div>
      <div className="medium-image">
        <img src={image} alt={text} />
      </div>
      <div className="medium-detail">
        <p className="medium-name">{text}</p>
        <p className="medium-date">{date}</p>
      </div>
    </div>
  );
};

export default PopMedium02;