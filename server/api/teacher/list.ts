import { Request, Response } from 'express';

import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    try {
      if ((await admin.firestore().collection('proposals').where('studentId', '==', userAuth.uid).get()).docs[0]?.exists)
        return res.status(202).send({ message: 'Proposal already submitted', status: 202 });

      if ((await admin.firestore().collection('projects').where('studentId', '==', userAuth.uid).get()).docs[0]?.exists)
        return res.status(202).send({ message: 'You already have project', status: 202 });

      const userData = (await admin.firestore().collection('users').doc(userAuth.uid).get()).data();

      // User doesnt have current year set
      if (!userData?.currentYear) return res.status(412).send();

      // Teacher cant submit proposal
      if (userData?.teacher) return res.status(403).send('Teacher cannot submit proposal');

      const teachersData = (await admin.firestore().collection('users').where('teacher', '==', true).where('extern', '==', false).where('deleted', '==', false).get()).docs;

      const teachersList = teachersData.map((teacherDoc) => {
        return {
          placeholder: teacherDoc.data().displayName,
          value: teacherDoc.id,
        };
      });

      return res.status(200).json(teachersList);
    } catch (e) {
      return res.status(500).send(e);
    }
  } catch (e) {
    return res.status(401).send();
  }
};
