import { Middleware } from '@nuxt/types';
import { useMainStore } from '@/store';

const proposalMiddleware: Middleware = ({ redirect }) => {
  const mainStore = useMainStore();

  if (mainStore.projectId.value) return redirect('/myproject');
};

export default proposalMiddleware;
