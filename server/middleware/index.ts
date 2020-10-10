import { ServerMiddleware } from '@nuxt/types';

import admin from 'firebase-admin';

const serverMiddleware: ServerMiddleware = async (req, res, next): Promise<void> => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const userAuth = await (async () => {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (e) {}
  })();

  console.log(userAuth);

  if (userAuth) {
    // @ts-ignore
    res.locals = {
      user: (await admin.firestore().collection('users').doc(userAuth.uid).get()).data(),
    };
  }

  next();
};

export default serverMiddleware;
