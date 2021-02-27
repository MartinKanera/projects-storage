<template lang="pug">
.flex.flex-col.justify-center.m-4(class='md:m-20')
  .flex.flex-col(class='lg:flex-row')
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentProjects', :maxCount='statistics.currentMaxStudents') Žáci kteří mají zadání
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentSubmittedProjects', :maxCount='statistics.currentMaxStudents') Vložené práce
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentReviews', :maxCount='statistics.currentMaxReviews') Odevzdaná hodnocení
  ps-tabs.mt-4.w-full(:tabs='["aktuální projekty", "ostatní projekty", "žáci", "učitelé", "externí učitelé", "vyhledávání"]', :selected='selectedTab', @selected='setTab', class='md:w-auto')
    ps-tab(:active='selectedTab == "aktuální projekty"')
      .flex.justify-between.items-center
        span.text-ps-white.text-xl Aktuální školní rok
        ps-btn(@click='deadlineModal = !deadlineModal') Termín
          template(#icon-right)
            date-icon(:size='20')/
        ps-modal(v-model='deadlineModal')
          span.text-ps-white.text-lg Termíny
          ps-text-field.mt-8.text-ps-white(v-model='projectDeadline', type='datetime-local', name='project-deadline', label='Termín odevzdání projektu')
          ps-text-field.mt-8.text-ps-white(v-model='reviewDeadline', type='datetime-local', name='review-deadline', label='Termín odevzdání posudků')
          ps-btn.mt-4.ml-auto(@click='updateDeadline', :disabled='updatingDeadline', :loading='updatingDeadline') aktualizovat
      ps-admin-project.mt-4(
        v-for='project in currentYearProjects',
        :key='project.projectId',
        :projectId='project.projectId',
        :currentYear='project.currentYear',
        :opponentId='project.opponentId',
        :publicProject='project.publicProject',
        :reviews='project.reviews',
        :studentId='project.studentId',
        :submittedDate='project.submittedDate',
        :teacherId='project.teacherId',
        :title='project.title',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture',
        :teachers='teachers',
        :deadlineDate='project.deadlineDate',
        :url='project.url'
      )
    ps-tab(:active='selectedTab == "ostatní projekty"')
      span.text-ps-white.text-xl.mt-2 Ostatní projekty
      ps-admin-project.mt-2(
        v-for='project in olderProjects',
        :key='project.projectId',
        :projectId='project.projectId',
        :currentYear='project.currentYear',
        :opponentId='project.opponentId',
        :publicProject='project.publicProject',
        :reviews='project.reviews',
        :studentId='project.studentId',
        :submittedDate='project.submittedDate',
        :teacherId='project.teacherId',
        :title='project.title',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture',
        :teachers='teachers',
        :deadlineDate='project.deadlineDate',
        :url='project.url',
        :year='project.year'
      )
    ps-tab(:active='selectedTab == "žáci"')
      ps-student.mt-4(
        v-for='student in students',
        :key='student.id',
        :studentId='student.id',
        :displayName='student.displayName',
        :profilePicture='student.profilePicture',
        :currentYear='student.currentYear',
        :year='student.year',
        :schoolYear='currentSchoolYear.toDate().getFullYear()'
      )
    ps-tab(:active='selectedTab == "učitelé"')
      ps-teacher.mt-4(
        v-for='teacher in internTeachers',
        :key='teacher.teacherId',
        :teacherId='teacher.teacherId',
        :displayName='teacher.displayName',
        :profilePicture='teacher.profilePicture',
        :admin='teacher.admin'
      )
    ps-tab(:active='selectedTab == "externí učitelé"')
      .flex.flex-col
        ps-btn.self-end(@click='displayTeacherModal = !displayTeacherModal') založit účet
          template(#icon-right)
            plus-icon/
        ps-teacher.mt-4(
          extern,
          v-for='teacher in externTeachers',
          :key='teacher.teacherId',
          :teacherId='teacher.teacherId',
          :displayName='teacher.displayName',
          :profilePicture='teacher.profilePicture'
        )
        ps-modal(v-model='displayTeacherModal')
          span.text-lg.text-ps-white Založit účet
          .flex.flex-col
            ps-text-field.mt-8(v-model='displayName', type='text', label='Jméno', name='password')
            ps-text-field.mt-8(v-model='email', type='email', label='Email', name='email')
            ps-text-field.mt-8(v-model='password', type='text', label='Heslo', name='password')
            ps-btn.mt-8.self-end(@click='createTeacher', :disabled='teacherBtn', :loading='teacherBtn') vytvořit účet
    ps-tab(:active='selectedTab == "vyhledávání"')
      ps-search-bar(v-model='query')
      ps-admin-project.mt-2(
        v-for='project in searchedProjects',
        :key='project.projectId',
        :projectId='project.projectId',
        :currentYear='project.currentYear',
        :opponentId='project.opponentId',
        :publicProject='project.publicProject',
        :reviews='project.reviews',
        :studentId='project.studentId',
        :submittedDate='project.submittedDate',
        :teacherId='project.teacherId',
        :title='project.title',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture',
        :teachers='teachers',
        :url='project.url'
      )
  ps-snackbar(v-model='displaySnack', :delay='5000') {{ message }}
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, onBeforeUnmount } from '@nuxtjs/composition-api';

import { debounce } from 'ts-debounce';

import axios from 'axios';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import plusIcon from 'vue-material-design-icons/Plus.vue';
import dateIcon from 'vue-material-design-icons/CalendarOutline.vue';

type Project = {
  projectId: String;
  currentYear: firebase.firestore.Timestamp;
  opponentId: String;
  publicProject: Boolean;
  reviews: [];
  studentId: String;
  submittedDate: firebase.firestore.Timestamp;
  teacherId: String;
  title: String;
  displayName: String;
  profilePicture: String;
  deadlineDate: String | null;
  url: String;
  year: String;
};

type Teacher = {
  teacherId: String;
  displayName: String;
  profilePicture: String;
  admin: Boolean | undefined;
};

type Student = {
  id: String;
  displayName: String;
  profilePicture: String;
  currentYear: firebase.firestore.Timestamp;
  year: Number;
};

export default defineComponent({
  components: {
    plusIcon,
    dateIcon,
  },
  middleware: 'admin',
  setup() {
    const message = ref('');
    const displaySnack = ref(false);

    const statistics = ref({} as firebase.firestore.DocumentData | undefined);
    const statsLoading = ref(true);

    const currentSchoolYear = ref(firebase.firestore.Timestamp.prototype);

    const selectedTab = ref('aktuální projekty');

    const setTab = (tab: string) => {
      selectedTab.value = tab;

      switch (selectedTab.value) {
        case 'aktuální projekty': {
          window.onscroll = currentYearLazyLoading;
          break;
        }
        case 'ostatní projekty': {
          if (olderProjects.value.length === 0) getOlderProjects();
          window.onscroll = olderLazyLoading;
          break;
        }
        case 'externí učitelé': {
          if (externTeachers.value.length === 0 && internTeachers.value.length === 0) getTeachers();
          break;
        }
        case 'učitelé': {
          if (externTeachers.value.length === 0 && internTeachers.value.length === 0) getTeachers();
          break;
        }
        case 'žáci': {
          if (students.value.length === 0) getStudents();
          window.scroll = studentsLazyLoading;
          break;
        }
      }
    };

    const getUserDocs = async (projectDocs: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[]) => {
      if (projectDocs.length === 0) return;

      const studentIds = projectDocs.map((project) => project.data()?.studentId);

      return (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', studentIds).get()).docs;
    };

    const formatProjectArray = (projectDocs: any, userDocs: any) => {
      return projectDocs.map((project: any) => {
        const userData = userDocs?.find((user: any) => user.id === project.data()?.studentId)?.data();
        const projectData = project.data();

        return {
          projectId: project.id,
          currentYear: projectData?.currentYear,
          opponentId: projectData?.opponentId,
          publicProject: projectData?.public,
          reviews: projectData?.reviews,
          studentId: projectData?.studentId,
          submittedDate: projectData?.submittedDate,
          teacherId: projectData?.teacherId,
          title: projectData?.title,
          displayName: userData?.displayName,
          profilePicture: userData?.profilePicture,
          deadlineDate: formatDate(projectData?.deadlineDate),
          url: projectData?.url,
          year: (projectData?.currentYear as firebase.firestore.Timestamp).toDate().getFullYear(),
        };
      });
    };

    const formatDate = (timestamp: firebase.firestore.Timestamp | undefined) => {
      if (!timestamp) return `${new Date().getFullYear()}-01-01T12:00`;

      const date = timestamp.toDate();

      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toLocaleString('cs-CZ', { minimumIntegerDigits: 2, useGrouping: false })}-${date
        .getDate()
        .toLocaleString('cs-CZ', { minimumIntegerDigits: 2, useGrouping: false })}`;
      const formattedTime = `${date.getHours().toLocaleString('cs-CZ', { minimumIntegerDigits: 2, useGrouping: false })}:${date
        .getMinutes()
        .toLocaleString('cs-CZ', { minimumIntegerDigits: 2, useGrouping: false })}`;

      return `${formattedDate}T${formattedTime}`;
    };

    // set new global deadline
    const deadlineModal = ref(false);

    const projectDeadline = ref('');
    const reviewDeadline = ref('');

    const updatingDeadline = ref(false);

    const updateDeadline = async () => {
      try {
        updatingDeadline.value = true;

        await axios.put(
          '/api/system/deadlines',
          {
            projectDeadline: projectDeadline.value,
            reviewDeadline: reviewDeadline.value,
          },
          {
            headers: {
              Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          },
        );

        deadlineModal.value = false;
      } catch (e) {
        console.error(e);
      }
      updatingDeadline.value = false;
    };

    const teachers = ref([]);

    const currentYearProjects = ref([] as Array<Project>);
    const listeners: Array<Function> = [];
    let lastOfCurrent: any = null;

    // current year projects

    onMounted(async () => {
      try {
        statistics.value = (await firebase.firestore().collection('system').doc('statistics').get()).data();

        const schoolYear = (await firebase.firestore().collection('system').doc('schoolYear').get()).data();

        currentSchoolYear.value = schoolYear?.currentYear;

        projectDeadline.value = formatDate(schoolYear?.projectDeadline as firebase.firestore.Timestamp);
        reviewDeadline.value = formatDate(schoolYear?.reviewDeadline as firebase.firestore.Timestamp);

        // @ts-ignore
        teachers.value = (await firebase.firestore().collection('users').where('teacher', '==', true).get()).docs.map((teacher) => {
          return {
            value: teacher.id,
            placeholder: teacher.data()?.displayName,
            extern: teacher.data()?.extern,
          };
        });

        statsLoading.value = false;
      } catch (e) {
        console.error(e);
      }

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .orderBy(firebase.firestore.FieldPath.documentId(), 'asc')
          .where('currentYear', '==', currentSchoolYear.value)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfCurrent = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              currentYearProjects.value = currentYearProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              currentYearProjects.value.push(project);
            });

            window.onscroll = currentYearLazyLoading;
          }),
      );
    });

    const currentYearLazyLoading = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOfCurrent) return;

      console.log('Bottom of current years projects');

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '==', currentSchoolYear.value)
          .startAfter(lastOfCurrent)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfCurrent = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              currentYearProjects.value = currentYearProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              currentYearProjects.value.push(project);
            });
          }),
      );
    };

    // Older projects
    const olderProjects = ref([] as Array<Project>);
    let lastOfAll: any = null;

    const getOlderProjects = () => {
      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '!=', currentSchoolYear.value)
          .orderBy('currentYear', 'desc')
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfAll = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              olderProjects.value = olderProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              olderProjects.value.push(project);
            });
          }),
      );
    };

    const olderLazyLoading = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOfAll) return;

      console.log('Bottom of older projects');

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '!=', currentSchoolYear.value)
          .orderBy('currentYear', 'desc')
          .startAfter(lastOfAll)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfAll = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              olderProjects.value = olderProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              olderProjects.value.push(project);
            });
          }),
      );
    };

    // Extern teachers view
    const externTeachers = ref([] as Array<Teacher>);
    const internTeachers = ref([] as Array<Teacher>);

    const getTeachers = () => {
      try {
        listeners.push(
          firebase
            .firestore()
            .collection('users')
            .where('teacher', '==', true)
            .where('deleted', '==', false)
            .onSnapshot((teachersSnap) => {
              externTeachers.value = [];
              internTeachers.value = [];

              teachersSnap.docs.forEach((teacher) => {
                if (teacher.data()?.extern) {
                  externTeachers.value.push({
                    teacherId: teacher.id,
                    displayName: teacher.data()?.displayName,
                    profilePicture: teacher.data()?.profilePicture,
                    admin: false,
                  });
                } else {
                  internTeachers.value.push({
                    teacherId: teacher.id,
                    displayName: teacher.data()?.displayName,
                    profilePicture: teacher.data()?.profilePicture,
                    admin: teacher.data().admin,
                  });
                }
              });
            }),
        );
      } catch (e) {}
    };

    const email = ref('');
    const password = ref('');
    const displayName = ref('');

    const displayTeacherModal = ref(false);
    const teacherBtn = ref(false);

    const createTeacher = async () => {
      try {
        teacherBtn.value = true;

        await axios.put(
          '/api/teacher/create',
          { email: email.value, password: password.value, displayName: displayName.value },
          {
            headers: {
              Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          },
        );

        email.value = '';
        password.value = '';
        displayName.value = '';

        message.value = 'Účet učitele vytvořen';
        displaySnack.value = true;

        displayTeacherModal.value = false;
      } catch (e) {
        console.error(e);

        switch (e.response.data.code) {
          case 'auth/email-already-exists': {
            message.value = 'Email už je využíván';
            break;
          }
          case 'auth/invalid-password': {
            message.value = 'Heslo musí mít alespoň 6 znaků';
            break;
          }
          default: {
            message.value = 'Chyba při vytváření účtu';
            break;
          }
        }

        displaySnack.value = true;
      }
      teacherBtn.value = false;
    };

    const students = ref([] as Array<Student>);
    let lastStudent: any = null;

    const getStudents = () => {
      listeners.push(
        firebase
          .firestore()
          .collection('users')
          .where('student', '==', true)
          .orderBy('currentYear', 'desc')
          .limit(10)
          .onSnapshot((snapshots) => {
            const studentsDocs = snapshots.docs;

            lastStudent = studentsDocs[studentsDocs.length - 1];

            const studentsData = studentsDocs.map((studentDoc) => {
              return {
                id: studentDoc.id,
                displayName: studentDoc.data()?.displayName,
                profilePicture: studentDoc.data()?.profilePicture,
                currentYear: studentDoc.data()?.currentYear,
                year: (studentDoc.data()?.currentYear as firebase.firestore.Timestamp).toDate().getFullYear(),
              };
            });

            studentsData.forEach((student: Student) => {
              students.value = students.value.filter((currentProject) => currentProject.id !== student.id);
              students.value.push(student);
            });
          }),
      );
    };

    const studentsLazyLoading = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastStudent) return;

      console.log('Bottom of students');

      listeners.push(
        firebase
          .firestore()
          .collection('users')
          .where('student', '==', true)
          .where('currentYear', '==', currentSchoolYear.value)
          .startAfter(lastOfAll)
          .limit(10)
          .onSnapshot((snapshots) => {
            const studentsDocs = snapshots.docs;

            lastStudent = studentsDocs[studentsDocs.length - 1];

            const studentsData = studentsDocs.map((studentDoc) => {
              return {
                id: studentDoc.id,
                displayName: studentDoc.data()?.displayName,
                profilePicture: studentDoc.data()?.profilePicture,
                currentYear: studentDoc.data()?.currentYear,
                year: (studentDoc.data()?.currentYear as firebase.firestore.Timestamp).toDate().getFullYear(),
              };
            });

            studentsData.forEach((student: Student) => {
              students.value = students.value.filter((currentProject) => currentProject.id !== student.id);
              students.value.push(student);
            });
          }),
      );
    };

    // Title based search

    const query = ref('');
    const searchedProjects = ref([] as Array<Project>);

    const getDocuments = async () => {
      try {
        const projectDocs = (
          await firebase
            .firestore()
            .collection('projects')
            .where('titleLower', '>=', query.value.toLowerCase())
            .where('titleLower', '<=', query.value.toLowerCase() + '\uF8FF')
            .get()
        ).docs;

        const usersDocs = await getUserDocs(projectDocs);

        searchedProjects.value = formatProjectArray(projectDocs, usersDocs);
      } catch (_) {}
    };
    const fetch = debounce(getDocuments, 1000);

    watch(query, (query) => {
      if (query === '') {
        searchedProjects.value = [];
        fetch.cancel();
        return;
      }
      fetch();
    });

    onBeforeUnmount(() => {
      listeners.forEach((listener: Function) => listener());
    });

    return {
      message,
      displaySnack,
      selectedTab,
      setTab,
      statistics,
      statsLoading,
      externTeachers,
      displayTeacherModal,
      email,
      password,
      createTeacher,
      displayName,
      teacherBtn,
      olderProjects,
      currentYearProjects,
      teachers,
      internTeachers,
      students,
      projectDeadline,
      reviewDeadline,
      deadlineModal,
      updateDeadline,
      updatingDeadline,
      query,
      searchedProjects,
      currentSchoolYear,
    };
  },
});
</script>
