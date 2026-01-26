import type { NavigatorScreenParams } from '@react-navigation/native';
import type { TabParamList } from '@/navigation/types/tabs';
import type { HomeStackParamList } from '@/navigation/types/home-stack';
import type { ExploreStackParamList } from '@/navigation/types/explore-stack';
import type { ChatStackParamList } from '@/navigation/types/chat-stack';
import type { MyStackParamList } from '@/navigation/types/my-stack';
import { AuthStackParamList } from '@/navigation/types/auth-stack';
import { CertificationStackParamList } from '@/navigation/types/certification-stack';
import type { CommonStackParamList } from '@/navigation/types/common-stack';

export type RootStackParamList = {
  NavBar: NavigatorScreenParams<TabParamList>;
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  ChatStack: NavigatorScreenParams<ChatStackParamList>;
  MyStack: NavigatorScreenParams<MyStackParamList>;
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  ExploreStack: NavigatorScreenParams<ExploreStackParamList>;
  CertificationStack: NavigatorScreenParams<CertificationStackParamList>;
  CommonStack: NavigatorScreenParams<CommonStackParamList>;
};
