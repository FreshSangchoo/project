export interface HeaderProps {
  title: string;
  leftChilds?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  rightChilds?: {
    icon: React.ReactNode;
    onPress: () => void;
  }[];
}
