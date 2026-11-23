/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Optional Firebase Integration Bridge
 * By default, KisanMandi uses built-in local SQLite storage with zero external cloud dependency.
 * Firebase is initialized ONLY if VITE_ENABLE_FIREBASE === 'true' is explicitly configured.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseEnabled = import.meta.env.VITE_ENABLE_FIREBASE === 'true';

let appInstance = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseEnabled) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth(appInstance);
  } catch (err) {
    console.warn('Optional Firebase initialization skipped:', err);
  }
}

export const db = dbInstance;
export const auth = authInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export async function testConnection(): Promise<boolean> {
  return isFirebaseEnabled && dbInstance !== null;
}
