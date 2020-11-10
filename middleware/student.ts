import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const studentMiddleware: Middleware = (ctx) => {
  const mainStore = useMainStore();

  if (!mainStore.isLoggedIn.value || !mainStore.isStudent.value || !mainStore.state.user.currentYear) {
    ctx.redirect('/');
  }
};

export default studentMiddleware;
