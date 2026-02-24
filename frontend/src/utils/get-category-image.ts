import BeautyIcon from "@assets/category/beauty_icon.svg";
import FashionIcon from "@assets/category/fashion_icon.svg";
import FoodIcon from "@assets/category/food_icon.svg";
import CharacterIcon from "@assets/category/charactor_icon.svg";
import LivingIcon from "@assets/category/living_icon.svg";
import EntertainmentIcon from "@assets/category/entertainment_icon.svg";
import GameIcon from "@assets/category/game_icon.svg";
import DigitalIcon from "@assets/category/digital_icon.svg";
import ContentsIcon from "@assets/category/contents_icon.svg";
import HobbyIcon from "@assets/category/hobby_icon.svg";

export interface CategoryProps {
    id: number,
    image: string;
    text: string;
}

const categories: CategoryProps[] = [
    {id: 1, image: BeautyIcon, text: "뷰티"},
    {id: 2, image: FashionIcon, text: "패션"},
    {id: 3, image: FoodIcon, text: "음식/음료"},
    {id: 4, image: CharacterIcon, text: "캐릭터"},
    {id: 5, image: LivingIcon, text: "리빙/금융"},
    {id: 6, image: EntertainmentIcon, text: "연예"},
    {id: 7, image: GameIcon, text: "게임"},
    {id: 8, image: DigitalIcon, text: "가전/디지털"},
    {id: 9, image: ContentsIcon, text: "콘텐츠"},
    {id: 10, image: HobbyIcon, text: "취미/여가"},
];

export default categories;