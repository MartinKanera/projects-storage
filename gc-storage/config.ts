import * as Cloud from '@google-cloud/storage';
import { env } from '../env';

const { Storage } = Cloud;

export const storage = new Storage({ credentials: env.storageServiceAccount });
