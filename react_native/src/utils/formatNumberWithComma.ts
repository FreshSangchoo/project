export default function formatNumberWithComma(value: string) {
  const onlyNumber = value.replace(/\D/g, '');
  return onlyNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
