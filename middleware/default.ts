import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const middleware: Middleware = (ctx) => {
  const mainStore = useMainStore();

  if (mainStore.isStudent.value && mainStore.class.value === '') ctx.redirect('/');
};

export default middleware;
