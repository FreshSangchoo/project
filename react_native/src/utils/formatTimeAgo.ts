export function formatTimeAgo(createdAt: string | Date): string {
  const created = new Date(createdAt);
  const now = new Date();

  // 한국 시간(UTC+9)으로 변환하기 위해 getTimezoneOffset을 사용하여 시간차를 적용
  const koreaOffset = 9 * 60; // 한국 시간(UTC+9)의 시간 차이 (분 단위)

  // now를 한국 시간으로 변환
  const createdInKorea = new Date(created.getTime());
  const nowInKorea = new Date(now.getTime());

  // console.log(createdInKorea.getTime(), nowInKorea.getTime()); // 시간 확인

  const diffMs = nowInKorea.getTime() - createdInKorea.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 방금 전 (최대 59초)
  if (diffSec < 60) return '방금 전';

  // m분 전 (최대 59분)
  if (diffMin < 60) return `${diffMin}분 전`;

  // h시간 전 (최대 23시간)
  if (diffHour < 24) return `${diffHour}시간 전`;

  // d일 전 (최대 7일)
  if (diffDay <= 7) return `${diffDay}일 전`;

  // (YYYY년) MM.DD
  const yearNow = nowInKorea.getFullYear();
  const yearCreated = createdInKorea.getFullYear();

  const month = String(createdInKorea.getMonth() + 1).padStart(2, '0');
  const day = String(createdInKorea.getDate()).padStart(2, '0'); // 날짜 2자리로 포맷

  if (yearNow === yearCreated) {
    // 같은 해일 경우: MM.DD 형식
    return `${month}.${day}`;
  } else {
    // 다른 해일 경우: YYYY.MM.DD 형식
    return `${yearCreated}.${month}.${day}`;
  }
}
