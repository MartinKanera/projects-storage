import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const studentMiddleware: Middleware = (ctx) => {
  const mainStore = useMainStore();

  if (!mainStore.isLoggedIn.value || !mainStore.isStudent.value) {
    ctx.redirect('/');
  }
};

export default studentMiddleware;
