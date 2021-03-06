import { Request, Response } from 'express';
import admin from 'firebase-admin';

const deleteFile = async (filePath: string) => {
  try {
    const storage = admin.storage().bucket('ps-project-files');

    await storage.file(filePath).delete();
  } catch (e) {
    console.error(e);
  }
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const filePath = req.params.filePath;

  if (!filePath) return res.status(400).send('Missing parameters');

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    try {
      const projectRef = (await admin.firestore().collection('projects').where('studentId', '==', userAuth.uid).get()).docs[0].ref;

      await admin.firestore().runTransaction(async (transaction) => {
        const project = await transaction.get(projectRef);

        if (!project.exists) throw new Error('404');
        if (project.data()?.submitted) throw new Error('409');

        if (project.data()?.deadlineDate != null) {
          if (admin.firestore.Timestamp.now() > project.data()?.deadlineDate) throw new Error('423');
        } else {
          const system = await transaction.get(admin.firestore().collection('system').doc('schoolYear'));

          if (admin.firestore.Timestamp.now() > system.data()?.projectDeadline) throw new Error('423');
        }

        const projectFilesRef = (await admin.firestore().collection('projectFiles').where('projectId', '==', project.id).get()).docs[0].ref;

        const sfDoc = await transaction.get(projectFilesRef);

        if (sfDoc.data()?.mandatory.every((file: any) => file.filePath !== filePath) && sfDoc.data()?.optional.every((file: any) => file.filePath !== filePath)) throw new Error('403');

        await deleteFile(filePath);

        transaction.update(projectFilesRef, {
          mandatory: sfDoc.data()?.mandatory.filter((file: any) => file.filePath !== filePath),
          optional: sfDoc.data()?.optional.filter((file: any) => file.filePath !== filePath),
        });

        return transaction;
      });

      return res.status(200).send();
    } catch (e) {
      console.error(e);
      switch (e.toString()) {
        case 'Error: 403':
          return res.status(403).send('You do not own this file');
        case 'Error: 404':
          return res.status(404).send('You do not have any project');
        case 'Error: 409':
          return res.status(409).send('You can not delete files after submitting');
        case 'Error: 423':
          return res.status(423).send('Past deadline');
        default:
          return res.status(500).send();
      }
    }
  } catch (_) {
    return res.status(401).send();
  }
};
