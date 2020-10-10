const parseFirebaseConfig = () => {
  if (process.env.FIREBASE_CONFIG) return JSON.parse(process.env.FIREBASE_CONFIG as string);

  console.error('Missing FIREBASE_CONFIG environment variable');
};

const parseServiceAccount = () => {
  if (process.env.SERVICE_ACCOUNT) return JSON.parse(process.env.SERVICE_ACCOUNT as string);

  console.error('Missing SERVICE_ACCOUNT environment variable');
};

const parseStorageServiceAccount = () => {
  if (process.env.STORAGE_SERVICE_ACCOUNT) return JSON.parse(process.env.STORAGE_SERVICE_ACCOUNT as string);

  console.error('Missing STORAGE_SERVICE_ACCOUNT environment variable');
};

export const env = {
  firebaseConfig: parseFirebaseConfig(),
  serviceAccount: parseServiceAccount(),
  storageServiceAccount: parseStorageServiceAccount(),
};
