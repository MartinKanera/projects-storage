import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const teacherMiddleware: Middleware = (ctx) => {
  const mainStore = useMainStore();

  if (!mainStore.isLoggedIn.value || !mainStore.isTeacher.value) {
    ctx.redirect('/');
  }
};

export default teacherMiddleware;
