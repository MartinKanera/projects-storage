import { ServerMiddleware } from '@nuxt/types';

import admin from 'firebase-admin';

const serverMiddleware: ServerMiddleware = async (req, res, next): Promise<void> => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    if (userAuth) {
      const project = (await admin.firestore().collection('projects').where('studentId', '==', userAuth.uid).get()).docs[0];

      const responseData = {
        user: {
          id: userAuth.uid,
          ...(await admin.firestore().collection('users').doc(userAuth.uid).get()).data(),
        },
        project: {
          id: project.id,
          ...project.data(),
        },
      };

      // @ts-ignore
      res.locals = responseData;
    }
  } catch (e) {}

  next();
};

export default serverMiddleware;
