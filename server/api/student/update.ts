import { Request, Response } from 'express';

import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const studentId = req.params.id;

  const yearTolerance = 4;

  const { displayName, year } = req.body;

  if (!displayName && !year && typeof year === 'number' && year <= year + yearTolerance) return res.status(400).send('Missing parameters');

  const currentYear = admin.firestore.Timestamp.fromDate(new Date(Date.UTC(year, 4, 25)));

  try {
    const user = await admin.auth().verifyIdToken(idToken);

    if (!(await admin.firestore().collection('users').doc(user.uid).get()).data()?.admin) return res.status(403).send('Only admin can update student');

    // if (!(await admin.firestore().collection('users').doc(studentId).get()).data()?.student) return res.status(404).send('No student with this id found');
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  const studentRef = admin.firestore().collection('users').doc(studentId);

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(studentRef);

      if (!sfDoc.data()?.student) return res.status(404).send('No student with this id found');

      transaction.update(studentRef, {
        displayName,
        currentYear,
      });

      return transaction;
    });

    return res.status(200).send();
  } catch (e) {
    return res.status(500).send(e);
  }
};
