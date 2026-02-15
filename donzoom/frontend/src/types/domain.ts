interface ImageUri {
  id?: number;
  uri: string;
}

interface Child {
  id: number;
  name: string;
  email: string;
  nickname: string;
  profileImage: string;
}

interface Profile {
  email: string;
  id: number;
  isParent: null;
  name: string;
  profileImage: string;
  children: Child[];
}

interface Quiz {
  quizId: number;
  question: string;
  answers: string[];
  correctAnswer: string;
  explanations: string[];
  answerExplanation: string;
}

export type {ImageUri, Profile, Child, Quiz};
