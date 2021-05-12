/* eslint-disable vue/valid-v-text */
import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

exports.projectsHooks = functions.firestore.document('projects/{projectId}').onWrite(async (snap, context) => {
  const statisticsRef = db.collection('system').doc('statistics');
  const currentYearRef = db.collection('system').doc('schoolYear');

  const runTransaction = async (difference: number) => {
    return await db.runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(statisticsRef);
  
      let projectsCount = sfDoc.data()?.currentProjects;

      if (!projectsCount) projectsCount = 0;
  
      transaction.set(statisticsRef, {
        currentProjects: projectsCount + difference,
        // 2 reviews per project
        currentMaxReviews: (projectsCount + difference) * 4,
      }, { merge: true });
  
      return transaction;
    });
  }

  if (!snap.before.data() && snap.after.data()) {
    const yearInfo = await currentYearRef.get();
    if (!(snap.after.data()?.currentYear as admin.firestore.Timestamp).isEqual(yearInfo.data()?.currentYear)) return;
    return await runTransaction(1);
  };
  if (!snap.after.data()) return await runTransaction(-1);

  if (snap.before.data() && snap.after.data()) {
    // Reviews were updated
    const oldReviewsCount = (snap.before.data()?.reviews ?? []).length;
    const newReviewsCount = (snap.after.data()?.reviews ?? []).length;

    if (oldReviewsCount !== newReviewsCount) {
      return await db.runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(statisticsRef)

        if (newReviewsCount > oldReviewsCount) {
          const oldFilePaths = snap.before.data()?.reviews.map((review: any) => review.filePath);

          const newReviews = snap.after.data()?.reviews.filter((review: any) => {
            return oldFilePaths.indexOf(review.filePath) === -1 && review.filePath.includes('.pdf');
          });

          if (newReviews.length > 0) transaction.set(db.collection('notifications').doc(), {
            userId: snap.after.data()?.studentId,
            message: `Nový posudek projektu`,
          });
        } 

        let reviewsCount = sfDoc.data()?.currentReviews;

        if (!reviewsCount) reviewsCount = 0;

        transaction.set(statisticsRef, {
          currentReviews: reviewsCount + newReviewsCount - oldReviewsCount,
        }, { merge: true });

        return transaction;
      })
    }

    // students currentYear changed
    if (!snap.before.data()?.currentYear.isEqual(snap.after.data()?.currentYear)) {
      const currentSchoolYear: admin.firestore.Timestamp = (await db.collection('system').doc('schoolYear').get()).data()?.currentYear;
      
      if (currentSchoolYear.isEqual(snap.after.data()?.currentYear)) await runTransaction(1);

      if (!currentSchoolYear.isEqual(snap.after.data()?.currentYear)) await runTransaction(-1)
    }

    if(snap.before.data() && !snap.after.data()) {
      const yearInfo = await currentYearRef.get();
      if (!(snap.after.data()?.currentYear as admin.firestore.Timestamp).isEqual(yearInfo.data()?.currentYear)) return;
      return await runTransaction(-1);
    }
  };

  return;
});

exports.usersHooks = functions.firestore.document('users/{userId}').onWrite(async (snap, context) => {
  const statisticsRef = db.collection('system').doc('statistics');

  const runTransaction = async (difference: number) => {
    return await db.runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(statisticsRef);
  
      let usersCount = sfDoc.data()?.currentMaxStudents;

      if (!usersCount) usersCount = 0;
  
      transaction.set(statisticsRef, {
        currentMaxStudents: usersCount + difference,
      }, { merge: true });
  
      return transaction;
    });
  }
  const currentSchoolYear: admin.firestore.Timestamp = (await db.collection('system').doc('schoolYear').get()).data()?.currentYear;

  if (!snap.before.data() && snap.after.data() && snap.after.data()?.student) return await runTransaction(1);
  // Delete
  if (!snap.after.data() && snap.before.data()?.student && currentSchoolYear.isEqual(snap.before.data()?.currentYear)) return await runTransaction(-1);
  // Update
  if (snap.before.data() && snap.after.data()) {
    if (snap.after.data()?.student) {
      // students currentYear changed
      if (!snap.before.data()?.currentYear.isEqual(snap.after.data()?.currentYear)) {
        
        if (currentSchoolYear.isEqual(snap.after.data()?.currentYear)) await runTransaction(1);

        if (!currentSchoolYear.isEqual(snap.after.data()?.currentYear)) await runTransaction(-1)

        try {
          const projectRef = (await db.collection('projects').where('studentId', '==', snap.after.id).get()).docs[0].ref;

          await db.runTransaction(async (transaction) => {
            const sfDoc = await transaction.get(projectRef);

            if (sfDoc.exists) transaction.set(projectRef, { currentYear: snap.after.data()?.currentYear }, { merge: true });

            return transaction;
          });
        } catch (e) {
          functions.logger.error(e);
        }
      }
    }
  };

  return;
});

// proposals
exports.proposalsHooks = functions.firestore.document('proposals/{proposalId}').onWrite(async (snap, context) => {
  if ((!snap.before.data() && snap.after.data()) || (snap.before.data() && snap.after.data())) {
    if (snap.after.data()?.studentId === null) return;

    await db.runTransaction(async (transaction) => {
      transaction.set(db.collection('notifications').doc(), {
        userId: snap.after.data()?.teacherId,
        message: `Nové zadání projektu s názvem ${snap.after.data()?.title}`
      })

      return transaction;
    });
  }

  return;
});

// Function ran annually on 25/5, prepares system for new school year
exports.newSchoolYear = functions.pubsub.schedule('0 0 25 5 *').timeZone('Europe/Prague').onRun(async () => {
  // UTC+2
  const newSchoolYear = admin.firestore.Timestamp.fromDate(new Date(Date.UTC(new Date().getFullYear(), 4, 25)));

  const statisticsRef = db.collection('system').doc('statistics');

  const newCurrentUsers = db.collection('users').where('currentYear', '==', newSchoolYear);

  try {
    await db.runTransaction(async (transaction) => {
      const currentUsers = await transaction.get(newCurrentUsers);
  
      transaction.set(statisticsRef, { 
        currentMaxStudents: currentUsers.docs.length,
        currentProjects: 0,
        currentReviews: 0,
        currentMaxReviews: 0,
        currentSubmittedProjects: 0,
      }, { merge: true });
  
      transaction.update(db.collection('system').doc('schoolYear'), {
        currentYear: newSchoolYear,
        projectDeadlineTriggered: false,
        reviewDeadlineTriggered: false,
      });
  
      return transaction;
    });
  } catch(e) {
    functions.logger.error(e);
  }

  return;
});

exports.notifications = functions.pubsub.schedule('every 24 hours').timeZone('Europe/Prague').onRun(async () => {
  const timeNow = new Date().getTime();
  const schoolYear = (await db.collection('system').doc('schoolYear').get()).data();

  // Check if is 14 days before project deadline
  const projectDeadline = (schoolYear?.projectDeadline as admin.firestore.Timestamp).seconds * 1000;

  if (projectDeadline - 14 * 24 * 3600 * 1000 <= timeNow && !schoolYear?.projectDeadlineTriggered) {
    // add notifications
    try {
      const batch = db.batch();
      const students = await db.collection('users').where('currentYear', '==', schoolYear?.currentYear).where('student', '==', true).get();

      students.docs.map((student) => {
        batch.set(db.collection('notifications').doc(), {
          userId: student.id,
          message: 'Zbývá méně, jak 14 dní do odevzdání projektu!'
        })
      });

      batch.update(db.collection('system').doc('schoolYear'), {
        projectDeadlineTriggered: true,
      });

      await batch.commit();
    } catch(e) {
      functions.logger.error(e);
    }
  }

  const reviewDeadline = (schoolYear?.reviewDeadline as admin.firestore.Timestamp).seconds * 1000;

  // Check if is 14 days before reviews deadline

  if (reviewDeadline - 14 * 24 * 3600 * 1000 <= timeNow && !schoolYear?.reviewDeadlineTriggered) {
    // add notifications
    try {
      const batch = db.batch();
      const teachers = await db.collection('users').where('teacher', '==', true).get();

      teachers.docs.map((teacher) => {
        batch.set(db.collection('notifications').doc(), {
          userId: teacher.id,
          message: 'Zbývá méně, jak 14 dní do odevzdání posudků!'
        })
      });

      batch.update(db.collection('system').doc('schoolYear'), {
        reviewDeadlineTriggered: true,
      });

      await batch.commit();
    } catch(e) {
      functions.logger.error(e);
    }
  }
});

exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  const projectRef = db.collection('projects').where('studentId', '==', user.uid).limit(1);
  const proposalRef = db.collection('proposals').where('studentId', '==', user.uid).limit(1);
  
  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const projectDoc = (await transaction.get(projectRef)).docs[0];
      const proposalDoc = (await transaction.get(proposalRef)).docs[0];
      const projectFilesDoc = ((await transaction.get(db.collection('projectFiles').where('projectId', '==', projectDoc.id).limit(1))).docs[0]);

      if (userDoc?.exists) transaction.delete(userRef);
      if (projectDoc?.exists) transaction.delete(projectDoc.ref);
      if (proposalDoc?.exists) transaction.delete(proposalDoc.ref);
      if (projectFilesDoc?.exists) {
        const storage = admin.storage();
        const bucket = storage.bucket('ps-project-files');

        const filesData = projectFilesDoc.data();
        await Promise.all([
          ...filesData?.mandatory.map((file: any) => bucket.file(file.filePath).delete()),
          ...filesData?.optional.map((file: any) => bucket.file(file.filePath).delete())
        ]);

        transaction.delete(projectFilesDoc.ref);
      }

      return transaction;
    });
  } catch(e) {
    functions.logger.error(e);
  }

  return;
});
