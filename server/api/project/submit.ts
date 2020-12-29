import { Request, Response } from 'express';
import admin from 'firebase-admin';

type ProjectFile = {
  filePath: string;
  fileName: string;
  uploaded: admin.firestore.Timestamp;
};

const checkFiles = async (files: Array<ProjectFile>) => {
  if (!files || files.length === 0) return false;

  const storage = admin.storage().bucket('ps-project-files');

  const response = await Promise.all(
    files.map(async (file) => {
      const { contentType } = (await storage.file(file.filePath).getMetadata())[0];
      const filePathSplitted = file.filePath.split('.');

      return {
        extension: filePathSplitted[filePathSplitted.length - 1],
        contentType,
      };
    }),
  );

  return (
    response.some((fileType) => fileType.extension === 'docx' && fileType.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
    response.some((fileType) => fileType.extension === 'pdf' && fileType.contentType === 'application/pdf') &&
    response.some(
      (fileType) =>
        (fileType.extension === 'zip' && fileType.contentType === 'application/x-zip-compressed') || (fileType.extension === 'rar' && fileType.contentType === 'application/octet-stream'),
    )
  );
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const projectId = req.params.id;

  if (!projectId) return res.status(400).send('Missing parameters');

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    try {
      const projectRef = admin.firestore().collection('projects').doc(projectId);
      const systemRef = admin.firestore().collection('system');

      await admin.firestore().runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(projectRef);

        if (!sfDoc.exists) throw new Error('404');

        const projectData = sfDoc.data();

        if (projectData?.studentId !== userAuth.uid) throw new Error('403');
        if (projectData?.submitted) throw new Error('409');

        if (sfDoc.data()?.deadlineDate != null) {
          if (admin.firestore.Timestamp.now() > sfDoc.data()?.deadlineDate) throw new Error('423');
        } else {
          const system = await transaction.get(systemRef.doc('schoolYear'));

          if (admin.firestore.Timestamp.now() > system.data()?.projectDeadline) throw new Error('423');
        }

        const statisticsDoc = await transaction.get(systemRef.doc('statistics'));

        const projectFiles = await transaction.get((await admin.firestore().collection('projectFiles').where('projectId', '==', sfDoc.id).limit(1).get()).docs[0].ref);
        const projectFilesData = projectFiles.data();

        // Check if user has saved files with .zip/.rar + .docx + .pdf
        const mandatoryFiles = projectFilesData?.mandatory;

        if (!(await checkFiles(mandatoryFiles))) throw new Error('412');

        transaction.update(projectRef, {
          submitted: true,
          submittedDate: admin.firestore.Timestamp.now(),
        });

        const newSubmittedProjects = (statisticsDoc.data()?.currentSubmittedProjects ?? 0) + 1;

        transaction.set(
          statisticsDoc.ref,
          {
            currentSubmittedProjects: newSubmittedProjects,
          },
          {
            merge: true,
          },
        );

        return transaction;
      });

      return res.status(200).send();
    } catch (e) {
      switch (e.toString()) {
        case 'Error: 403':
          return res.status(403).send('You do not own this project');
        case 'Error: 404':
          return res.status(404).send('Project does not exist');
        case 'Error: 409':
          return res.status(409).send('Project already submitted');
        case 'Error: 412':
          return res.status(412).send('Missing mandatory files (docx, pdf, zip/rar)');
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
