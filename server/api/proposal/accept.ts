import admin from 'firebase-admin';
import { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  if (!req.params.id) return res.status(400).send('Missing parameters');

  const proposalRef = admin.firestore().collection('proposals').doc(req.params.id);

  let user: any;

  try {
    user = await admin.auth().verifyIdToken(idToken);

    const userData = (await admin.firestore().collection('users').doc(user.uid).get()).data();

    if (!userData?.teacher) return res.status(403).send('User is not teacher');
  } catch {
    return res.status(401).send('Unauthorized');
  }

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(proposalRef);
      const studentDoc = await transaction.get(admin.firestore().collection('users').doc(sfDoc.data()?.studentId));

      if (!sfDoc.exists) throw new Error('404');
      if (sfDoc.data()?.teacherId !== user.uid) throw new Error('403');

      const projectRef = admin.firestore().collection('projects').doc();

      transaction.set(projectRef, {
        title: sfDoc.data()?.title,
        titleLower: sfDoc.data()?.title.toLowerCase(),
        description: '',
        studentId: sfDoc.data()?.studentId,
        teacherId: sfDoc.data()?.teacherId,
        opponentId: '',
        currentYear: studentDoc.data()?.currentYear,
        public: false,
        submitted: false,
        submittedDate: null,
        reviews: [],
        links: [],
        deadlineDate: null,
        keywords: [],
      });

      transaction.set(admin.firestore().collection('projectFiles').doc(), {
        projectId: projectRef.id,
        mandatory: [],
        optional: [],
      });

      transaction.delete(proposalRef);

      // add notification for student
      transaction.set(admin.firestore().collection('notifications').doc(), {
        userId: studentDoc.id,
        message: `Projekt ${sfDoc.data()?.title} byl schválen`,
      });

      return transaction;
    });
  } catch (e) {
    switch (e.toString()) {
      case 'Error: 403':
        return res.status(403).send('Proposal is not assigned to user');
      case 'Error: 404':
        return res.status(404).send('Proposal does not exist');
      default:
        return res.status(500).send(e);
    }
  }

  return res.status(200).send('Proposal accepted');
};
