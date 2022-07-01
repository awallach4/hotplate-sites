/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from "firebase-functions";
import { firestore, storage } from "./admin";

/*
 * The clearData function removes personal data from the RealTime Database,
 * Storage, and Firestore. It waits for all deletions to complete, and then
 * returns a success message.
 */
export const clearData = functions.auth.user().onDelete(async (user) => {
  functions.logger.log("Started delete user data execution.");

  const firestorePaths = "users/{UID},admin/{UID},webmasters/{UID}";
  const storagePaths = "{DEFAULT}/profile-photos/{UID}";

  const { uid } = user;

  await clearFirestoreData(firestorePaths, uid);
  await clearStorageData(storagePaths, uid);

  functions.logger.log(`Successfully removed data for user: ${uid}`);
});

const clearStorageData = async (storagePaths: string, uid: string) => {
  functions.logger.log("Deleting user data from Cloud Storage.");

  const paths = extractUserPaths(storagePaths, uid);
  const promises = paths.map(async (path) => {
    const parts = path.split("/");
    const bucketName = parts[0];
    const bucket =
      bucketName === "{DEFAULT}"
        ? storage.bucket(process.env.STORAGE_BUCKET)
        : storage.bucket(bucketName);
    const prefix = parts.slice(1).join("/");
    try {
      functions.logger.log(`Deleting '${prefix}' from Cloud Storage.`);
      await bucket.deleteFiles({
        prefix
      });
      functions.logger.log(`Deleted '${prefix}' from Cloud Storage.`);
    } catch (err) {
      const error = err as { code: number };
      if (error.code === 404) {
        functions.logger.log(
          `File: '${prefix}' does not exist in Cloud Storage, skipping.`
        );
      } else {
        functions.logger.error(
          `Error deleting: '${prefix}' from Cloud Storage`,
          err
        );
      }
    }
  });

  await Promise.all(promises);

  functions.logger.log("Finished deleting user data from Cloud Storage.");
};

const clearFirestoreData = async (firestorePaths: string, uid: string) => {
  functions.logger.log("Deleting user data from Cloud Firestore.");

  const paths = extractUserPaths(firestorePaths, uid);
  const promises = paths.map(async (path) => {
    try {
      functions.logger.log(`Deleting: '${path}' from Cloud Firestore.`);

      // Wrapping in transaction to allow for automatic retries (#48)
      await firestore.runTransaction((transaction) => {
        transaction.delete(firestore.doc(path));
        return Promise.resolve();
      });
      functions.logger.log(`Deleted: '${path}' from Cloud Firestore.`);
    } catch (err) {
      functions.logger.error(
        `Error when deleting: '${path}' from Cloud Firestore`,
        err
      );
    }
  });

  await Promise.all(promises);

  functions.logger.log("Deleted user data from Cloud Firestore");
};

const extractUserPaths = (paths: string, uid: string) => {
  return paths.split(",").map((path) => replaceUID(path, uid));
};

const replaceUID = (path: string, uid: string) => {
  return path.replace(/{UID}/g, uid);
};
