import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const middleware: Middleware = (ctx) => {
  const mainStore = useMainStore();
};

export default middleware;
