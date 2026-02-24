export interface PopupDetail {
  managerTsId: string;
  popupId: number;
  images: string[];
  name: string;
  startDate: string;
  endDate: string;
  hours: string;
  address: string;
  lat: number;
  lon: number;
  content: string;
  snsUrl: string;
  pageUrl: string;
  description: string;
  heart: number;
  hit: number;
  rating: number;
  deleted: boolean;
  checkPreReservation: boolean;
  preReservationOpenAt?: string;
  term?: number;
  maxPeoplePerSession?: number;
  maxReservationsPerPerson?: number;
  warning?: string;
}

export interface PopupWithPreReservationDTO {
  popupId: number;
  name: string;
  startDate: string;
  endDate: string;
  hours: string;
  snsUrl?: string;
  pageUrl?: string;
  content: string;
  description: string;
  address: string;
  lat: number;
  lon: number;
  heart: number;
  hit: number;
  rating: number;
  deleted: boolean;
  managerTsId: string;
  images: string[];
  categories: string[];
  checkPreReservation: boolean;
  preReservationOpenAt: string;
  term: number;
  maxPeoplePerSession: number;
  maxReservationsPerPerson: number;
  warning?: string;
}
