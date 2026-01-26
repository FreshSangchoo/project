import badWordsRaw from '@/constants/nicknameFilterList.json';

const STRIP_REGEX = /[\s\p{Z}\u200B-\u200D\uFEFF._\-~!@#$%^&*()[\]{}|\\;:'",<>/?`+=]/gu;

// 한글: 완성형(가-힣) + 호환 자모(ㄱ-ㅎㅏ-ㅣ) + 한글 자모 확장 영역(ᄀ-ᇿ)
// 영문: a-zA-Z, 숫자: 0-9
const ALLOWED_INPUT_REGEX = /[^가-힣ㄱ-ㅎㅏ-ㅣᄀ-ᇿa-zA-Z0-9]/g;

export function normalize(s: string) {
  return s.normalize('NFKC').toLowerCase().replace(STRIP_REGEX, '');
}

const BAD_WORDS_SET: Set<string> = new Set((badWordsRaw as string[]).map(w => normalize(w)).filter(Boolean));

export function containsBadWord(nickname: string) {
  const n = normalize(nickname);

  if (BAD_WORDS_SET.has(n)) return true;

  for (const bw of BAD_WORDS_SET) {
    if (bw && n.includes(bw)) {
      return true;
    }
  }
  return false;
}

export function sanitizeNicknameInput(input: string) {
  const result = input.replace(ALLOWED_INPUT_REGEX, '');

  // 디버깅: 필터링된 문자 로그
  if (input !== result && __DEV__) {
    const removed = input.split('').filter((char, i) => result[i] !== char || i >= result.length);
    console.log('[sanitizeNicknameInput] input:', input);
    console.log('[sanitizeNicknameInput] result:', result);
    console.log('[sanitizeNicknameInput] removed chars:', removed.map(c => `${c} (U+${c.charCodeAt(0).toString(16).toUpperCase()})`));
  }

  return result;
}
