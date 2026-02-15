import {create} from 'zustand';
import {validateSignup} from '@/utils/validate';
import { Child } from '@/types/domain';

interface SignupState {
  id: number;
  email: string;
  password: string;
  passwordConfirm: string;
  isParent: boolean;
  children: Child[];
  name: string;
  nickname: string;
  profileImage?: string;
  setId: (id: number) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setPasswordConfirm: (passwordConfirm: string) => void;
  setIsParent: (isParent: boolean) => void;
  setChildren: (children: Child[]) => void;
  setName: (name: string) => void;
  setNickname: (nickname: string) => void;
  setProfileImage: (profileImage: string) => void;
  validate: () => {email: string; password: string; passwordConfirm: string};
  reset: () => void;
}

const initialState = {
  id: 0,
  email: '',
  password: '',
  passwordConfirm: '',
  isParent: false,
  children: [],
  name: '',
  nickname: '',
  profileImage: undefined,
};

export const useSignupStore = create<SignupState>((set, get) => ({
  ...initialState,
  setId: id => set({id}),
  setEmail: email => set({email}),
  setPassword: password => set({password}),
  setPasswordConfirm: passwordConfirm => set({passwordConfirm}),
  setIsParent: isParent => set({isParent}),
  setChildren: children => set({children}),
  setName: name => set({name}),
  setNickname: nickname => set({nickname}),
  setProfileImage: profileImage => set({profileImage}),
  validate: () => {
    const {email, password, passwordConfirm} = get();
    return validateSignup({email, password, passwordConfirm});
  },
  reset: () => set(initialState),
}));
