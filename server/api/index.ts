import express from 'express';
import * as admin from 'firebase-admin';
import bodyParser from 'body-parser';
import { env } from '../../env';
const multer = require('multer');

const app = express();

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

const uploader = multer({
  storage: multer.memoryStorage(),
});

if (!admin.apps.length)
  admin.initializeApp({
    credential: admin.credential.cert(env.serviceAccount),
  });

// user
app.post('/user/create', async (req, res) => (await import('./user/create-user')).default(req, res));
app.put('/user/year', async (req, res) => (await import('./user/update-year')).default(req, res));

// proposal
app.put('/proposal/accept/:id', async (req, res) => (await import('./proposal/accept')).default(req, res));

// teacher
app.get('/teachers/list', async (req, res) => (await import('./teacher/list')).default(req, res));
app.put('/teacher/create', async (req, res) => (await import('./teacher/extern-teacher')).default(req, res));
app.delete('/user/delete/:id', async (req, res) => (await import('./user/remove')).default(req, res));

// student
app.put('/student/update/:id', async (req, res) => (await import('./student/update')).default(req, res));

// project
app.put('/project/:id', async (req, res) => (await import('./project/update')).default(req, res));

// review
app.post('/review/upload/:id', uploader.array('files'), async (req, res) => (await import('./review/upload')).default(req, res));

export default app;
