import { Request, Response } from 'express';
import admin from 'firebase-admin';

const checkLinks = (links: Array<{ url: string; placeholder: string }>) => {
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

  return links.every((link) => link.url.match(regex));
};

const uploadFiles = (files: Array<File>, destination: string) => {
  if (files.length === 0) return;

  console.log(files);
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const body = JSON.parse(req.body.projectData);

  // TODO check mandatory files match type

  if (!(typeof body.description === 'string' && Array.isArray(body.links) && req.params.id && checkLinks(body.links))) return res.status(400).send();

  // @ts-ignore
  const mandatoryFiles = req.files.mandatory;
  // @ts-ignore
  const optionalFiles = req.files.optional;

  try {
    const authUser = await admin.auth().verifyIdToken(idToken);

    try {
      const projectRef = admin.firestore().collection('projects').doc(req.params.id);

      admin.firestore().runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(projectRef);

        if (!sfDoc.exists) throw new Error('404');

        if (sfDoc.data()?.studentId !== authUser.uid) throw new Error('403');

        transaction.update(projectRef, {
          description: body.description.trim(),
          links: body.links,
        });

        // @ts-ignore
        if (mandatoryFiles) {
          uploadFiles(mandatoryFiles, 'mandatory');
        }
        if (optionalFiles) {
          uploadFiles(optionalFiles, 'optional');
        }

        return transaction;
      });
    } catch (e) {
      switch (e) {
        case '403':
          return res.status(403).send();
        case '404':
          return res.status(404).send();
        default:
          return res.status(500).send();
      }
    }

    return res.status(200).send();
  } catch (e) {
    return res.status(401).send();
  }
};
