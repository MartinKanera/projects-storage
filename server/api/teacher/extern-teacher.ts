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

  if (!(req.body.email || req.body.password)) return res.status(400).send('Missing parameters');

  const { email, password } = req.body;

  try {
    const newUser = await admin.auth().createUser({
      email,
      password,
    });

    const userRef = admin.firestore().collection('users').doc(newUser.uid);

    await admin.firestore().runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(userRef);

      if (sfDoc.exists) throw new Error('User document already exists');

      transaction.set(userRef, {
        admin: false,
        currentYear: null,
        student: false,
        teacher: true,
        extern: true,
        profilePicture: 'https://storage.googleapis.com/ps-profile-pictures/empty.png',
        displayName: req.body.displayName ? req.body.displayName : email,
        deleted: false,
      });

      return transaction;
    });

    return res.status(200).send();
  } catch (e) {
    return res.status(500).send(e);
  }
};
