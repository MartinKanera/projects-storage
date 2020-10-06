import express from 'express';
import * as admin from 'firebase-admin';
import bodyParser from 'body-parser';
import { env } from '../../env';

const app = express();

app.use(bodyParser.json());

if (!admin.apps.length)
  admin.initializeApp({
    credential: admin.credential.cert(env.serviceAccount),
  });

app.post('/user/create', async (req, res) => (await import('./user/create-user')).default(req, res));

export default app;