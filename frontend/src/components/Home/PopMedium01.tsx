interface PopMediumProps {
  image: string;
  text: string;
  date: string;
  rank: number;
}

const PopMedium01 = ({image, text, date, rank} : PopMediumProps) => {
  const formatRank = rank < 10 ? `0${rank}` : rank;

  return (
    <div id="pop-up-medium">
      <div className="pop-rank">
        <h1>{formatRank}</h1>
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
}

export default PopMedium01;