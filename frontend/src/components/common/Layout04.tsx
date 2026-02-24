import '@css/Layout.css';
import { ReactNode } from 'react';
import getIcon from '@utils/get-header-icon';
import Header from "./Header";
import Menu from "./Menu";

type LayoutProps = {
  children: ReactNode;
}

const Layout04 = (props: LayoutProps) => {
  return (
    <div>
      <Header leftIcon={getIcon("back")} rightIcon={getIcon("back_white")} />
      <main>{props.children}</main>
      <Menu />
    </div>
  );
};

export default Layout04;
