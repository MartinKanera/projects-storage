import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const projectMiddleware: Middleware = ({ redirect }) => {
  const mainStore = useMainStore();

  if (!mainStore.state.user.student || !mainStore.state.project.id) redirect('/');
};

export default projectMiddleware;
