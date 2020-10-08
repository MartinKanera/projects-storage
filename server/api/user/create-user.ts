import fs from 'fs';
import { Request, Response } from 'express';
import axios from 'axios';

import * as admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  // TODO implement req.body premade teachor account
  // TODO project doc

  const usersCollection = admin.firestore().collection('users');

  const saveProfileImage = async () => {
    try {
      const photoData = await axios.request({
        url: 'https://graph.microsoft.com/v1.0/me/photo/$value',
        method: 'get',
        responseType: 'arraybuffer',
        headers: {
          authorization: req.body.accessToken,
        },
      });

      const photoBin = await photoData.data;

      // fs.writeFileSync('./pokus.jpg', Buffer.from(photoBin, 'base64'));
    } catch (e) {}
  };

  try {
    const userData = await admin.auth().verifyIdToken(idToken);

    const userDoc = (await admin.firestore().collection('users').doc(userData.uid).get()).data();

    if (!userDoc) {
      await saveProfileImage();

      const newUserDoc = {
        displayName: userData.name,
        profilePicture: userData.picture ?? '',
        admin: false,
        student: userData.email?.includes('delta-studenti'),
        verified: false,
        class: '',
        year: 0,
      };

      await usersCollection.doc(userData.uid).set(newUserDoc);
    }

    return res.status(200).json({ user: newUserDoc, project: {} });
  } catch (e) {
    return res.status(400).send('Bad request');
  }
};
