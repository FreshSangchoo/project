export interface ConsentsProps {
  marketingConsent: boolean;
  marketingUpdatedAt: string;
  servicePushConsent: boolean;
  serviceUpdatedAt: string;
}

export interface CategoryProps {
    name: string;
}

export interface UserProps {
  userTsid: string | null,
  nickname: string;
  email: string;
  phoneNumber: string;
  userCategories: CategoryProps[];
  userConsents: ConsentsProps;
  role: string;
  img: File | null;
}