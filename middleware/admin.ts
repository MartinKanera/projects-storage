import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const proposalMiddleware: Middleware = ({ redirect }) => {
  const mainStore = useMainStore();

  if (!mainStore.isLoggedIn || !mainStore.isAdmin.value) return redirect('/');
};

export default proposalMiddleware;
