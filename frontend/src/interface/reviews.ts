export interface ReviewListProps {
  reviewId: number;
  nickname: string;
  img: string;
  rating: number;
  title: string;
  content: string;
  thumbnail: string;
  createdAt: string;
}

export interface ReviewProps {
  reviewId: number;
  userTsid: string;
  nickname: string;
  img: string;
  rating: number;
  title: string;
  content: string;
  thumbnail: string;
  createdAt: string;
  commentDtoList: CommentProps[]; // 댓글 인터페이스 추가되면 수정
}

export interface ReviewUpdateProps {
  rating: number;
  title: string;
  thumbnail: string;
  content: string;
}

export interface CommentProps {
  commentId: number;
  userTsid: number;
  nickname: string;
  img: string;
  reviewId: number;
  content: string;
  createdAt: string; // Instant를 string으로 변환하여 사용
  parent?: number | null; // parent가 null일 수 있으므로 optional로 지정
}