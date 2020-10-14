import { ServerMiddleware } from '@nuxt/types';

import admin from 'firebase-admin';

const serverMiddleware: ServerMiddleware = async (req, res, next): Promise<void> => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    if (userAuth) {
      // @ts-ignore
      res.locals = {
        user: (await admin.firestore().collection('users').doc(userAuth.uid).get()).data(),
      };
    }
  } catch (e) {}

  next();
};

export default serverMiddleware;
