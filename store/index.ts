import { createStore } from 'pinia';

type State = {
  user: {
    id: String;
    loggedIn: Boolean;
    displayName: String;
    profilePicture: String;
    student: Boolean;
    admin: Boolean;
    year: Number;
  };
  project: {
    id: String;
  };
};

export const useMainStore = createStore({
  id: 'main',
  state: (): State => ({
    user: {
      id: '',
      loggedIn: false,
      displayName: '',
      profilePicture: '',
      student: false,
      admin: false,
      year: 0,
    },
    project: {
      id: '',
    },
  }),
  getters: {
    isLoggedIn: (state: State) => state.user.loggedIn,
    displayName: (state: State) => state.user.displayName,
    profilePicture: (state: State) => state.user.profilePicture,
    isStudent: (state: State) => state.user.student,
    isAdmin: (state: State) => state.user.admin,
    projectId: (state: State) => state.project.id,
  },
});
