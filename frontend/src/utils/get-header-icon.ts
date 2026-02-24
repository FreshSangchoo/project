import notification from  "@assets/header/notification_icon.svg";
import search from "@assets/header/search_icon.svg"
import back from "@assets/header/back_icon.svg";
import back_white from "@assets/header/back_icon_white.svg";

const getIcon = (iconName: string): string => {
  switch (iconName) {
    case "notification":
      return notification;
    case "search":
      return search;
    case "back":
      return back;
    case "back_white":
      return back_white;
    default:
      return "";
  }
};

export default getIcon;
