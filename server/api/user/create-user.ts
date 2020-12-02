// import fs from 'fs';
import { Request, Response } from 'express';
import axios from 'axios';

import * as admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  // TODO implement req.body premade teachor account

  const usersCollection = admin.firestore().collection('users');

  const saveProfileImage = async (userId: string) => {
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

      const bucketName = 'ps-profile-pictures';
      const fileName = `${userId}.jpeg`;

      const bucket = admin.storage().bucket(bucketName);

      const userImage = bucket.file(fileName);
      const imageStream = userImage.createWriteStream();

      imageStream.write(photoBin);
      imageStream.end();

      return `https://storage.googleapis.com/${bucketName}/${fileName}`;
    } catch (_) {
      return 'https://storage.googleapis.com/ps-profile-pictures/empty.png';
    }
  };

  try {
    const userData = await admin.auth().verifyIdToken(idToken);

    const userDoc = (await admin.firestore().collection('users').doc(userData.uid).get()).data();

    if (!userDoc) {
      let newUserDoc = {
        displayName: userData.name,
        profilePicture: await saveProfileImage(userData.uid),
        admin: false,
        deleted: false,
        extern: false,
        student: userData.email?.includes('delta-studenti'),
        teacher: userData.email?.includes('delta-skola'),
        currentYear: null,
      };

      await usersCollection.doc(userData.uid).set(newUserDoc);

      newUserDoc = { ...newUserDoc, ...{ id: userData.uid } };

      return res.status(200).json({ user: newUserDoc });
    }

    const responseData = {
      user: {
        id: userData.uid,
        ...userDoc,
      },
    };

    try {
      const project = (await admin.firestore().collection('projects').where('studentId', '==', userData.uid).get()).docs[0];

      Object.assign(responseData, {
        project: {
          id: project.id,
          ...project.data(),
        },
      });
    } catch (_) {}

    return res.status(200).send(responseData);
  } catch (e) {
    return res.status(400).send('Bad request');
  }
};
