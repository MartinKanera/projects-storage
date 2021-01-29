import { Request, Response } from 'express';
import admin from 'firebase-admin';
import short from 'short-uuid';

const checkLinks = (links: Array<{ url: string; placeholder: string }>) => {
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

  return links.every((link) => link.url.match(regex));
};

const uploadFiles = async (files: Array<File>) => {
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

  if (!(typeof body.description === 'string' && Array.isArray(body.links) && req.params.id && checkLinks(body.links) && Array.isArray(body.keywords))) return res.status(400).send();

  // @ts-ignore
  const mandatoryFiles = req.files.mandatory;

  // Checking file type of mandatory files
  if (mandatoryFiles) {
    const mandatoryFilesTypes = mandatoryFiles.map((file: any) => {
      const splitted = file.originalname.split('.');

      return {
        extension: splitted[splitted.length - 1],
        type: file.mimetype,
      };
    });

    const supportedExtensions = ['docx', 'pdf', 'zip', 'rar'];
    const supportedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'application/x-zip-compressed', 'application/octet-stream'];

    if (mandatoryFilesTypes.some((fileType: any) => !supportedExtensions.includes(fileType.extension) || !supportedTypes.includes(fileType.type)))
      return res.status(415).send('Forbidden files provided');
  }

  // @ts-ignore
  const optionalFiles = req.files.optional;

  try {
    const authUser = await admin.auth().verifyIdToken(idToken);

    try {
      const projectRef = admin.firestore().collection('projects').doc(req.params.id);

      await admin.firestore().runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(projectRef);

        if (!sfDoc.exists) throw new Error('404');

        if (sfDoc.data()?.studentId !== authUser.uid) throw new Error('403');

        if (sfDoc.data()?.submitted) throw new Error('409');

        if (sfDoc.data()?.deadlineDate != null) {
          if (admin.firestore.Timestamp.now() > sfDoc.data()?.deadlineDate) throw new Error('423');
        } else {
          const system = await transaction.get(admin.firestore().collection('system').doc('schoolYear'));

          if (admin.firestore.Timestamp.now() > system.data()?.projectDeadline) throw new Error('423');
        }

        const projectFilesRef = (await admin.firestore().collection('projectFiles').where('projectId', '==', sfDoc.id).get()).docs[0].ref;

        const projectFilesDoc = await transaction.get(projectFilesRef);

        transaction.update(projectRef, {
          description: body.description.trim(),
          links: body.links,
          keywords: body.keywords,
        });

        const mandatoryUploaded = Array.isArray(body.mandatoryOrder) && !!body.mandatoryOrder.length ? body.mandatoryOrder && body.mandatoryOrder : (projectFilesDoc.data()?.mandatory as []);
        const optionalUploaded = Array.isArray(body.optionalOrder) && !!body.optionalOrder.length ? body.optionalOrder : (projectFilesDoc.data()?.optional as []);

        //  @ts-ignore
        (await uploadFiles(mandatoryFiles))?.forEach((uploadedFle) => mandatoryUploaded.push(uploadedFle));
        //  @ts-ignore
        (await uploadFiles(optionalFiles))?.forEach((uploadedFle) => optionalUploaded.push(uploadedFle));

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
        case 'Error: 409':
          return res.status(409).send('Project already submitted');
        case 'Error: 423':
          return res.status(423).send('Past deadline');
        default:
          return res.status(500).send();
      }
    }

    return res.status(200).send();
  } catch (e) {
    return res.status(401).send();
  }
};
