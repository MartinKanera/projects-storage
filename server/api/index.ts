import express from 'express';
import * as admin from 'firebase-admin';
import bodyParser from 'body-parser';
import { env } from '../../env';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

if (!admin.apps.length)
  admin.initializeApp({
    credential: admin.credential.cert(env.serviceAccount),
  });

app.post('/user/create', async (req, res) => (await import('./user/create-user')).default(req, res));
app.get('/teachers/list', async (req, res) => (await import('./teachers/list')).default(req, res));
app.put('/proposal/accept', async (req, res) => (await import('./proposals/accept')).default(req, res));

export default app;
