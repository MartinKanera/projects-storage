import { Request, Response } from 'express';
import admin from 'firebase-admin';
import short from 'short-uuid';

const checkLinks = (links: Array<{ url: string; placeholder: string }>) => {
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

  return links.every((link) => link.url.match(regex));
};

const uploadFiles = async (files: Array<File>, destination: string) => {
  if (!files || files.length === 0) return;

  const storage = admin.storage().bucket('ps-project-files');

  const updatedFiles = files.map((file: any) => {
    const splitName = file.originalname.split('.');
    file.customName = `${short().new()}.${splitName[splitName.length - 1]}`;

    return file;
  });

  const response = await Promise.all(
    updatedFiles.map((file: any) => {
      return new Promise((resolve, reject) => {
        const blob = storage.file(file.customName);

        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
            contentDisposition: `inline; filename="${file.originalname}"`,
          },
          resumable: false,
        });

        blobStream.on('finish', () => {
          resolve({
            fileName: file.originalname,
            filePath: `${blob.name}`,
            uploaded: admin.firestore.Timestamp.now(),
          });
        });

        blobStream.on('error', (e) => {
          console.error(e);
          reject(e);
        });

        blobStream.end(file.buffer);
      });
    }),
  );

  return response ?? [];
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

        const projectFilesRef = (await admin.firestore().collection('projectFiles').where('projectId', '==', sfDoc.id).get()).docs[0].ref;

        const projectFilesDoc = await transaction.get(projectFilesRef);

        transaction.update(projectRef, {
          description: body.description.trim(),
          links: body.links,
        });

        const mandatoryUploaded = projectFilesDoc.data()?.mandatory as [];
        const optionalUploaded = projectFilesDoc.data()?.optional as [];

        //  @ts-ignore
        (await uploadFiles(mandatoryFiles, 'mandatory'))?.forEach((uploadedFle) => mandatoryUploaded.push(uploadedFle));
        //  @ts-ignore
        (await uploadFiles(optionalFiles, 'optional'))?.forEach((uploadedFle) => optionalUploaded.push(uploadedFle));

        transaction.update(projectFilesRef, {
          mandatory: mandatoryUploaded,
          optional: optionalUploaded,
        });

        return transaction;
      });
    } catch (e) {
      console.error(e);

      switch (e.toString()) {
        case 'Error: 403':
          return res.status(403).send();
        case 'Error: 404':
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
