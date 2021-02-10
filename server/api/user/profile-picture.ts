import { Request, Response } from 'express';
import admin from 'firebase-admin';

import short from 'short-uuid';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  // @ts-ignore
  const avatarImg = req.file;

  const splittedName = avatarImg.originalname.split('.');
  const extension = splittedName[splittedName.length - 1];

  const acceptedExtensions = ['jpeg', 'jpg', 'png', 'gif'];

  if (!avatarImg.mimetype.includes('image/') || !acceptedExtensions.some((acceptedExtension) => acceptedExtension === extension)) return res.status(400).send();

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    try {
      const bucket = admin.storage().bucket('ps-profile-pictures');
      const userRef = admin.firestore().collection('users').doc(userAuth.uid);

      const fileName = `${short().new()}.${extension}`;

      const uploadedUrl = await new Promise((resolve, reject) => {
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: avatarImg.mimetype,
          },
          resumable: false,
        });

        blobStream.on('finish', async () => {
          try {
            await admin.firestore().runTransaction(async (transaction) => {
              const sfDoc = await transaction.get(userRef);

              if (!sfDoc.data()?.profilePicture.includes('empty')) {
                const splittedUrl = sfDoc.data()?.profilePicture.split('/');
                await bucket.file(splittedUrl[splittedUrl.length - 1]).delete();
              }

              transaction.update(userRef, {
                profilePicture: `https://storage.googleapis.com/ps-profile-pictures/${fileName}`,
              });

              return transaction;
            });
          } catch (e) {
            reject(e);
          }

          resolve(`https://storage.googleapis.com/ps-profile-pictures/${fileName}`);
        });

        blobStream.on('error', (e) => {
          reject(e);
        });

        blobStream.end(avatarImg.buffer);
      });

      return res.status(200).send(uploadedUrl);
    } catch (e) {
      console.error(e);
      return res.status(500).send(e);
    }
  } catch (_) {
    return res.status(401).send();
  }
};
