import AlertToast from '@/components/common/toast/AlertToast';
import Toast from '@/components/common/toast/Toast';
import { useToastStore } from '@/stores/toastStore';

export default function GlobalToast() {
  const { visible, message, image, duration, pulse, variant } = useToastStore(s => s);

  if (variant === 'alert') return <AlertToast key={pulse} visible={visible} duration={duration} />;

  if (!image) return null;
  return <Toast key={pulse} message={message} visible={visible} image={image} duration={duration} />;
}
