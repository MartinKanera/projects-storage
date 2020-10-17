import { createStore } from 'pinia';

type State = {
  loggedIn: Boolean;
  displayName: String;
  profilePicture: String;
  student: Boolean;
  admin: Boolean;
  class: String;
  year: Number;
};

export const useMainStore = createStore({
  id: 'main',
  state: (): State => ({
    loggedIn: false,
    displayName: '',
    profilePicture: '',
    student: false,
    admin: false,
    class: '',
    year: 0,
  }),
  getters: {
    isLoggedIn: (state: State) => state.loggedIn,
    displayName: (state: State) => state.displayName,
    profilePicture: (state: State) => state.profilePicture,
    isStudent: (state: State) => state.student,
    isAdmin: (state: State) => state.admin,
    class: (state: State) => state.class,
  },
});
