import { Request, Response } from 'express';

import * as admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  // TODO implement req.body premade teachor account
  // TODO project doc

  const usersCollection = admin.firestore().collection('users');

  try {
    const userData = await admin.auth().verifyIdToken(idToken);

    const userDoc = (await admin.firestore().collection('users').doc(userData.uid).get()).data();

    const newUserDoc = {
      displayName: userData.name,
      profilePicture: userData.picture ?? '',
      admin: false,
      student: userData.email?.includes('delta-studenti'),
      verified: false,
      class: '',
      year: 0,
    };

    if (!userDoc) {
      await usersCollection.doc(userData.uid).set(newUserDoc);
    }

    return res.status(200).json({ user: newUserDoc, project: {} });
  } catch (e) {
    return res.status(400).send('Bad request');
  }
};
