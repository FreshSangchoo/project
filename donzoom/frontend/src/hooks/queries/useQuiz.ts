import {getTodayQuiz, submitQuizAnswer, getSolvedQuiz} from '@/api/quiz';
import {UseMutationCustomOptions, UseQueryCustomOptions} from '@/types/common';
import {useMutation, useQuery} from '@tanstack/react-query';

function useGetTodayQuiz(queryOptions?: UseQueryCustomOptions<any>) {
  return useQuery({
    queryKey: ['getTodayQuiz'],
    queryFn: getTodayQuiz,
    enabled:false,
    ...queryOptions,
  });
}

function useGetSolvedQuiz(queryOptions?: UseQueryCustomOptions<any>) {
  return useQuery({
    queryKey: ['getSolvedQuiz'],
    queryFn: getSolvedQuiz,
    ...queryOptions,
  });
}

function usePostSubmitQuizAnswer(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: submitQuizAnswer,
    ...mutationOptions,
  });
}

function useQuiz() {
  const todayQuizMutation = useGetTodayQuiz();
  const solvedQuizMutation = useGetSolvedQuiz();
  const submitQuizAnswerMutation = usePostSubmitQuizAnswer();

  return {todayQuizMutation, submitQuizAnswerMutation, solvedQuizMutation};
}
export default useQuiz;
