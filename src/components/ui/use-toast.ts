export { useToast } from '@/hooks/use-toast';

export const toast = (...args: any[]) => {
  const { toast: toastFn } = useToast();
  return toastFn(...args);
};
