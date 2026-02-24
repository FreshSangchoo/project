import { Link } from "react-router-dom";
import { CategoryProps } from "@utils/get-category-image";

const CategoryButton = ({ id, image, text }: CategoryProps) => {
  return (
    <Link to={`/category/${id}`} className="category-button">
      <div className="category-image">
        <img src={image} alt={text} />
      </div>
      <span className="category-text">{text}</span>
    </Link>
  );
};

export default CategoryButton;
