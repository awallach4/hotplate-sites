import type { StorageError, UploadTaskSnapshot } from "firebase/storage";
import { user } from "./authHandler";

/**
 * Uploads a file to Firebase Storage.
 * @async
 * @function uploadFile
 * @param path The path to the desired Firebase Storage location.
 * @param file The file object to upload.
 * @param overwriteFunction The function to call if the user confirms overwriting an existing file.
 * @param progressFunction The function to call when the upload progress changes.
 * @returns The URL to the uploaded file.
 */
export const uploadFile = async (
  path: string,
  file: File,
  overwriteFunction?: (url: string) => void,
  progressFunction?: (snapshot: UploadTaskSnapshot) => void
) => {
  const { storage } = await import("@/plugins/firebase");
  const {
    ref: storageRef,
    getDownloadURL,
    uploadBytesResumable
  } = await import("firebase/storage");
  const imgRef = storageRef(storage, path);
  const metadata = {
    cacheControl: "no-cache private max-age=604800",
    customMetadata: {
      uid: user.value.uid
    }
  };
  if (overwriteFunction) {
    let overwrite = false;
    try {
      const url = await getDownloadURL(imgRef);
      overwrite = confirm(
        "A file with this name already exists.  Do you want to overwrite it?"
      );
      if (overwrite) {
        overwriteFunction(url);
      }
    } catch (error) {
      overwrite = true;
    }
    if (!overwrite) {
      return "";
    }
  }
  const uploadTask = uploadBytesResumable(imgRef, file, metadata);
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      if (progressFunction) {
        progressFunction(snapshot);
      }
    },
    (error) => {
      throw error.message;
    }
  );
  try {
    await uploadTask;
    const url = await getDownloadURL(uploadTask.snapshot.ref);
    return url;
  } catch (error) {
    const rawError = error as StorageError;
    throw rawError.message;
  }
};

/**
 * Deletes a file from Firebase Storage.
 * @async
 * @function deleteFile
 * @param path The path to the file to delete.
 * @returns Nothing.
 */
export const deleteFile = async (path: string) => {
  try {
    const { storage } = await import("@/plugins/firebase");
    const { ref: storageRef, deleteObject } = await import("firebase/storage");
    const imgRef = storageRef(storage, path);
    await deleteObject(imgRef);
  } catch (error) {
    const rawError = error as StorageError;
    throw rawError.message;
  }
};
