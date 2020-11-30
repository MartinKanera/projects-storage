/* eslint-disable vue/valid-v-text */
import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

exports.projectsHooks = functions.firestore.document('projects/{projectId}').onWrite(async (snap, context) => {
  const statisticsRef = db.collection('system').doc('statistics');

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

  if (!snap.before.data() && snap.after.data()) return await runTransaction(1);
  if (!snap.after.data()) return await runTransaction(-1);

  if (snap.before.data() && snap.after.data()) {
    // Reviews were updated
    const oldReviewsCount = (snap.before.data()?.reviews ?? []).length;
    const newReviewsCount = (snap.after.data()?.reviews ?? []).length;

    if (oldReviewsCount !== newReviewsCount) {
      return await db.runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(statisticsRef)

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
  };

  // TODO onUpdate project is submitted
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

// TODO Yearly function set school currentSchoolYear, reset all system fields and update maxStudents count 
exports.newSchoolYear = functions.pubsub.schedule('0 0 25 5 *').timeZone('Europe/Prague').onRun(async () => {
  // UTC+2
  const newSchoolYear = admin.firestore.Timestamp.fromDate(new Date(new Date().getFullYear(), 4, 24, 22));

  const statisticsRef = db.collection('system').doc('statistics');

  try {
    await db.collection('system').doc('schoolYear').set({
      currentYear: newSchoolYear,
    });

    // TODO add properties for reviews and submitted projects
    await statisticsRef.set({
      currentMaxStudents: 0,
      currentProjects: 0,
      currentReviews: 0,
      currentMaxReviews: 0,
    }, { merge: true })
  } catch (_) {};

  const newCurrentUsers = db.collection('users').where('currentYear', '==', newSchoolYear);

  return await db.runTransaction(async (transaction) => {
    const currentUsers = await transaction.get(newCurrentUsers);

    transaction.update(statisticsRef, { 
      currentMaxStudents: currentUsers.docs.length
    });

    return transaction;
  });
});