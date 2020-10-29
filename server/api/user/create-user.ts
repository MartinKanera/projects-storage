// import fs from 'fs';
import { Request, Response } from 'express';
import axios from 'axios';

import * as admin from 'firebase-admin';
import { storage } from '../../../gc-storage';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  // TODO implement req.body premade teachor account
  // TODO project doc

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

      const bucket = storage.bucket(bucketName);

      const userImage = bucket.file(fileName);
      const imageStream = userImage.createWriteStream();

      imageStream.write(photoBin);
      imageStream.end();

      return `https://storage.googleapis.com/${bucketName}/${fileName}`;
    } catch (_) {
      // TODO take 'anonymous' profile picture
      return '';
    }
  };

  try {
    const userData = await admin.auth().verifyIdToken(idToken);

    const userDoc = (await admin.firestore().collection('users').doc(userData.uid).get()).data();

    if (!userDoc) {
      const newUserDoc = {
        displayName: userData.name,
        profilePicture: await saveProfileImage(userData.uid),
        admin: false,
        student: userData.email?.includes('delta-studenti'),
        verified: false,
        year: 0,
      };

      await usersCollection.doc(userData.uid).set(newUserDoc);

      Object.assign('newUserDoc', { id: userData.uid });

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

      Object.assign('project', {
        id: project.id,
        ...project.data(),
      });
    } catch (_) {}

    return res.status(200).send(responseData);
  } catch (e) {
    return res.status(400).send('Bad request');
  }
};
