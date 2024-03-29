<template lang="pug">
.flex.flex-col.justify-center.m-4(class='md:m-20 md:mt-8')
  .flex.justify-center.mb-4
    .rounded-lg.shadow.bg-ps-secondary.flex.px-2
      .text-ps-white.mr-2 Termín odevzdání:
      .text-ps-green.text-lg {{ deadlineFormatted[deadlineFormatted.length - 1] === ":" ? deadlineFormatted.substr(0, deadlineFormatted.length - 1) : deadlineFormatted }}
  .self-start(v-if='proposals.length > 0')
    span.text-2xl.text-ps-white.font-medium Projekty ke schválení
  .flex.flex-col.mt-4.mb-8.flex-wrap.justify-between(v-if='proposals.length > 0', class='md:flex-row md:justify-start')
    ps-student-proposal(
      v-for='proposal in proposals',
      :key='proposal.studentId',
      :studentId='proposal.studentId',
      :displayName='proposal.displayName',
      :projectTitle='proposal.projectTitle',
      :profilePicture='proposal.profilePicture',
      :proposalRef='proposal.proposalRef'
    )
  ps-tabs(:tabs='extern ? ["oponent"] : ["aktuální projekty", "ostatní projekty", "předpřipravená zadání", "oponent"]', :selected='selectedTab', @selected='setTab')
    ps-tab(v-if='!extern', :active='selectedTab == "aktuální projekty"')
      .flex.justify-between(v-if='projects.length > 0')
        span.text-2xl.text-ps-white.font-medium Moji studenti
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-teacher-project(
          v-for='project in projects',
          :key='project.projectId',
          :projectId='project.projectId',
          :projectTitle='project.projectTitle',
          :displayName='project.displayName',
          :profilePicture='project.profilePicture',
          :reviews='project.reviews',
          :pastDeadline='pastDeadline',
          :teacher='project.teacher',
          :opponent='project.opponent',
          :url='project.url'
        )
      .flex.justify-between.mt-2(v-if='submittedProjects.length > 0')
        span.text-2xl.text-ps-white.font-medium Projekty k hodnocení
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-teacher-project(
          v-for='project in submittedProjects',
          :key='project.projectId',
          :projectId='project.projectId',
          :projectTitle='project.projectTitle',
          :displayName='project.displayName',
          :profilePicture='project.profilePicture',
          :reviews='project.reviews',
          :pastDeadline='pastDeadline',
          :teacher='project.teacher',
          :opponent='project.opponent',
          :submitted='true',
          :url='project.url'
        )
    ps-tab(v-if='!extern', :active='selectedTab == "ostatní projekty"')
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-teacher-project(
          v-for='project in otherProjects',
          :key='project.projectId',
          :projectId='project.projectId',
          :projectTitle='project.projectTitle',
          :displayName='project.displayName',
          :profilePicture='project.profilePicture',
          :reviews='project.reviews',
          :pastDeadline='pastDeadline',
          :teacher='project.teacher',
          :opponent='project.opponent',
          :url='project.url',
          :year='project.year'
        )
    ps-tab(v-if='!extern', :active='selectedTab == "předpřipravená zadání"')
      .flex.flex-col.justify-between(class='md:flex-row')
        span.text-2xl.text-ps-white.font-medium Předpřipravené projekty
        ps-btn.self-start(@click='projectModal', class='md:self-center') Přidat zadání
          template(#icon-right)
            plus-icon/
        ps-modal(v-model='projectModalDisplay')
          span.text-2xl.text-ps-white.font-medium Přidat zadání projektu
          ps-text-field.my-8(name='project-name', label='Název projektu', v-model='projectTitle')
          ps-btn.ml-auto(@click='addProject', :disabled='submitting || disabledBtn', :loading='submitting') Přidat projekt
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-premade-project(v-for='project in premadeProjects', :key='project.projectId', :projectId='project.projectId', :projectTitle='project.projectTitle')
    ps-tab(:active='selectedTab == "oponent"')
      .flex.justify-between
        span.text-2xl.text-ps-white.font-medium Projekty k hodnocení
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-teacher-project(
          v-for='project in opponentProjects',
          :key='project.projectId',
          :projectId='project.projectId',
          :projectTitle='project.projectTitle',
          :displayName='project.displayName',
          :profilePicture='project.profilePicture',
          :reviews='project.reviews',
          :pastDeadline='pastDeadline',
          :teacher='project.teacher',
          :opponent='project.opponent',
          :submitted='true'
        )
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, onMounted, onBeforeUnmount, computed } from '@nuxtjs/composition-api';

import { useMainStore } from '@/store';
import firebase from 'firebase/app';
import 'firebase/firestore';

import plusIcon from 'vue-material-design-icons/Plus.vue';

type StudentProposal = {
  studentId: String;
  displayName: String;
  projectTitle: String;
  profilePicture: String;
  proposalRef: firebase.firestore.DocumentReference;
};

type Project = {
  projectId: String;
  projectTitle: String;
  displayName: String;
  profilePicture: String;
  reviews: [];
  teacher: Boolean;
  opponent: Boolean;
  url: String;
  year: String;
};

type PremadeProject = {
  projectId: String;
  projectTitle: String;
};

export default defineComponent({
  components: {
    plusIcon,
  },
  middleware: 'teacher',
  setup() {
    const mainStore = useMainStore();

    const selectedTab = ref(mainStore.state.user.extern ? 'oponent' : 'aktuální projekty');

    const setTab = (tab: string) => {
      selectedTab.value = tab;
      if (tab === 'ostatní projekty') {
        window.onscroll = otherLazyLoad;
      }
    };

    const listeners: Array<Function> = [];

    const proposals = ref([] as Array<StudentProposal>);
    const projects = ref([] as Array<Project>);
    const submittedProjects = ref([] as Array<Project>);
    const premadeProjects = ref([] as Array<PremadeProject>);
    const opponentProjects = ref([] as Array<Project>);

    const inArray = async (colRef: firebase.firestore.CollectionReference, inputArray: Array<String>) => {
      const perCall = 10;

      if (inputArray.length <= perCall) return (await colRef.where(firebase.firestore.FieldPath.documentId(), 'in', inputArray).get()).docs;

      const chunks: Array<Array<String>> = [];

      inputArray.forEach((element, i) => {
        const chunkIndex = Math.floor(i / perCall);

        if (!chunks[chunkIndex]) chunks[chunkIndex] = [];

        chunks[chunkIndex].push(element);
      });

      let resultArray: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[] = [];

      chunks.forEach(async (array) => {
        resultArray = [...resultArray, ...(await colRef.where(firebase.firestore.FieldPath.documentId(), 'in', array).get()).docs];
      });

      return resultArray;
    };

    const pastDeadline = ref(true);
    const currentYear = ref(new firebase.firestore.Timestamp(0, 0));

    const reviewsDeadline = ref(new firebase.firestore.Timestamp(0, 0));
    const deadlineFormatted = computed(() => `${reviewsDeadline.value.toDate().toLocaleDateString('cs-CZ')} ${reviewsDeadline.value.toDate().toLocaleTimeString('cs-CZ').substr(0, 5)}`);

    onMounted(async () => {
      // get system values - schoolYear and reviewsDeadline
      try {
        const systemData = (await firebase.firestore().collection('system').doc('schoolYear').get()).data();

        reviewsDeadline.value = systemData?.reviewDeadline;

        pastDeadline.value = firebase.firestore.Timestamp.now() > systemData?.reviewDeadline;
        currentYear.value = systemData?.currentYear;
      } catch (_) {
        console.error('Error getting system values');
      }

      // add snapshot listener for proposals
      try {
        listeners.push(
          firebase
            .firestore()
            .collection('proposals')
            .where('teacherId', '==', mainStore.state.user.id)
            .where('studentId', '!=', null)
            .onSnapshot(async (proposalsSnap) => {
              const studentIds = proposalsSnap.docs.map((proposal) => proposal.data().studentId);
              const proposalsRefs = proposalsSnap.docs.map((proposal) => {
                return {
                  studentId: proposal.data().studentId,
                  ref: proposal.ref,
                };
              });

              if (!studentIds.length) {
                proposals.value = [];
                return;
              }

              const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);

              proposals.value = studentsColection.map((studentDoc) => {
                return {
                  studentId: studentDoc.id,
                  displayName: studentDoc.data().displayName,
                  projectTitle: proposalsSnap.docs.find((proposalDoc) => proposalDoc.data().studentId === studentDoc.id)?.data().title,
                  profilePicture: studentDoc.data().profilePicture,
                  proposalRef: proposalsRefs.find((proposalRef) => proposalRef.studentId === studentDoc.id)!.ref,
                };
              });
            }),
        );
      } catch (_) {}

      // add snapshot listener for unsubmitted projects
      try {
        listeners.push(
          firebase
            .firestore()
            .collection('projects')
            .where('currentYear', '==', currentYear.value)
            .where('submitted', '==', false)
            .where('teacherId', '==', mainStore.state.user.id)
            .onSnapshot(async (projectSnap) => {
              const studentIds = projectSnap.docs.map((projectDoc) => projectDoc.data().studentId);

              if (!studentIds.length) {
                projects.value = [];
                return;
              }

              const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);

              projects.value = projectSnap.docs.map((projectDoc) => {
                const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

                return {
                  projectId: projectDoc.id,
                  projectTitle: projectDoc.data().title,
                  displayName: currentStudent?.data().displayName,
                  profilePicture: currentStudent?.data().profilePicture,
                  reviews: (projectDoc.data()?.reviews ?? []).filter((review: any) => review.teacherId === mainStore.state.user.id),
                  teacher: projectDoc.data()?.teacherId === mainStore.state.user.id,
                  opponent: projectDoc.data()?.opponentId === mainStore.state.user.id,
                  url: projectDoc.data()?.url,
                  year: '',
                };
              });
            }),
        );

        fetchOtherProjects();
      } catch (_) {}

      // add snapshot listener for submitted projects
      try {
        listeners.push(
          firebase
            .firestore()
            .collection('projects')
            .where('currentYear', '==', currentYear.value)
            .where('submitted', '==', true)
            .where('teacherId', '==', mainStore.state.user.id)
            .onSnapshot(async (projectSnap) => {
              const studentIds = projectSnap.docs.map((projectDoc) => projectDoc.data().studentId);

              if (!studentIds.length) {
                submittedProjects.value = [];
                return;
              }

              const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);

              submittedProjects.value = projectSnap.docs.map((projectDoc) => {
                const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

                return {
                  projectId: projectDoc.id,
                  projectTitle: projectDoc.data().title,
                  displayName: currentStudent?.data().displayName,
                  profilePicture: currentStudent?.data().profilePicture,
                  reviews: (projectDoc.data()?.reviews ?? []).filter((review: any) => review.teacherId === mainStore.state.user.id),
                  teacher: projectDoc.data()?.teacherId === mainStore.state.user.id,
                  opponent: projectDoc.data()?.opponentId === mainStore.state.user.id,
                  url: projectDoc.data()?.url,
                  year: '',
                };
              });
            }),
        );
      } catch (e) {
        console.error(e);
      }

      // add snapshot listener for teacher's premade projects
      try {
        listeners.push(
          firebase
            .firestore()
            .collection('proposals')
            .where('teacherId', '==', mainStore.state.user.id)
            .where('studentId', '==', null)
            .where('premade', '==', true)
            .onSnapshot((premadeSnap) => {
              premadeProjects.value = premadeSnap.docs.map((premadeDoc) => {
                return {
                  projectId: premadeDoc.id,
                  projectTitle: premadeDoc.data()?.title,
                };
              });
            }),
        );
      } catch (_) {}

      // add snapshot listener for opponent projects
      try {
        listeners.push(
          firebase
            .firestore()
            .collection('projects')
            .where('currentYear', '==', currentYear.value)
            .where('submitted', '==', true)
            .where('opponentId', '==', mainStore.state.user.id)
            .onSnapshot(async (projectSnap) => {
              const studentIds = projectSnap.docs.map((projectDoc) => projectDoc.data().studentId);

              if (!studentIds.length) {
                projects.value = [];
                return;
              }

              const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);

              opponentProjects.value = projectSnap.docs.map((projectDoc) => {
                const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

                return {
                  projectId: projectDoc.id,
                  projectTitle: projectDoc.data().title,
                  displayName: currentStudent?.data().displayName,
                  profilePicture: currentStudent?.data().profilePicture,
                  reviews: (projectDoc.data()?.reviews ?? []).filter((review: any) => review.teacherId === mainStore.state.user.id),
                  teacher: projectDoc.data()?.teacherId === mainStore.state.user.id,
                  opponent: projectDoc.data()?.opponentId === mainStore.state.user.id,
                  url: projectDoc.data()?.url,
                  year: '',
                };
              });
            }),
        );
      } catch (e) {
        console.error(e);
      }
    });

    const projectModalDisplay = ref(false);

    const projectModal = () => {
      projectModalDisplay.value = !projectModalDisplay.value;
    };

    const projectTitle = ref('');

    const submitting = ref(false);
    const disabledBtn = ref(true);

    watchEffect(() => {
      disabledBtn.value = projectTitle.value === '';
    });

    const addProject = async () => {
      submitting.value = true;
      const docRef = firebase.firestore().collection('proposals').doc();

      try {
        await docRef.set({
          premade: true,
          title: projectTitle.value,
          teacherId: mainStore.state.user.id,
          studentId: null,
        });
      } catch (e) {
        console.error(e);
      }

      submitting.value = false;
      projectTitle.value = '';
      projectModal();
    };

    // add snapshot listener for other projects
    const otherProjects = ref([] as Array<Project>);
    let lastOther: any = null;

    const fetchOtherProjects = () => {
      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('teacherId', '==', mainStore.state.user.id)
          .where('currentYear', '!=', currentYear.value)
          .orderBy('currentYear', 'desc')
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;
            const studentIds = snapshots.docs.map((projectDoc) => projectDoc.data().studentId);

            if (!studentIds.length) return;

            const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);
            lastOther = projectDocs[projectDocs.length - 1];

            const projects = projectDocs.map((projectDoc) => {
              const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

              return {
                projectId: projectDoc.id,
                projectTitle: projectDoc.data().title,
                displayName: currentStudent?.data().displayName,
                profilePicture: currentStudent?.data().profilePicture,
                reviews: (projectDoc.data()?.reviews ?? []).filter((review: any) => review.teacherId === mainStore.state.user.id),
                teacher: projectDoc.data()?.teacherId === mainStore.state.user.id,
                opponent: projectDoc.data()?.opponentId === mainStore.state.user.id,
                url: projectDoc.data()?.url,
                year: (projectDoc.data()?.currentYear as firebase.firestore.Timestamp).toDate().getFullYear(),
              };
            });

            projects.forEach((project: any) => {
              otherProjects.value = otherProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              otherProjects.value.push(project);
            });
          }),
      );
    };

    const otherLazyLoad = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOther) return;

      console.log('Bottom of other projects');

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('teacherId', '==', mainStore.state.user.id)
          .where('currentYear', '!=', currentYear.value)
          .orderBy('currentYear', 'desc')
          .startAfter(lastOther)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;
            const studentIds = snapshots.docs.map((projectDoc) => projectDoc.data().studentId);

            const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);
            lastOther = projectDocs[projectDocs.length - 1];

            const projects = projectDocs.map((projectDoc) => {
              const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

              return {
                projectId: projectDoc.id,
                projectTitle: projectDoc.data().title,
                displayName: currentStudent?.data().displayName,
                profilePicture: currentStudent?.data().profilePicture,
                reviews: (projectDoc.data()?.reviews ?? []).filter((review: any) => review.teacherId === mainStore.state.user.id),
                teacher: projectDoc.data()?.teacherId === mainStore.state.user.id,
                opponent: projectDoc.data()?.opponentId === mainStore.state.user.id,
                url: projectDoc.data()?.url,
                year: (projectDoc.data()?.currentYear as firebase.firestore.Timestamp).toDate().getFullYear(),
              };
            });

            projects.forEach((project: any) => {
              otherProjects.value = otherProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              otherProjects.value.push(project);
            });
          }),
      );
    };

    // Unsubscribe all snapshot listeners
    onBeforeUnmount(() => {
      listeners.forEach((listener) => listener());
    });

    return {
      selectedTab,
      setTab,
      proposals,
      projects,
      submittedProjects,
      projectModal,
      projectModalDisplay,
      projectTitle,
      addProject,
      submitting,
      disabledBtn,
      premadeProjects,
      opponentProjects,
      pastDeadline,
      extern: mainStore.state.user.extern,
      otherProjects,
      deadlineFormatted,
    };
  },
});
</script>
