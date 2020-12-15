import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    const user = await admin.auth().verifyIdToken(idToken);

    if (!(await admin.firestore().collection('users').doc(user.uid).get()).data()?.admin) return res.status(403).send();
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  if (!req.params.id) return res.status(400).send('Missing parameters');

  try {
    const userRef = admin.firestore().collection('users').doc(req.params.id);

    await admin.firestore().runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(userRef);

      if (!(sfDoc.exists || sfDoc.data()?.extern)) return res.status(404).send('User does not exist/is not teacher');

      transaction.set(
        userRef,
        {
          deleted: true,
        },
        { merge: true },
      );

      await admin.auth().deleteUser(req.params.id);

      return transaction;
    });

    return res.status(200).send();
  } catch (e) {
    return res.status(500).send(e);
  }
};
