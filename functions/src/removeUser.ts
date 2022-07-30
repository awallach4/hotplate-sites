import { auth, firestore } from "./admin";
import * as functions from "firebase-functions";

const removeUser = functions.https.onCall(async (data, context) => {
  if (context.app === undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app."
    );
  }
  const uid = data.uid;
  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request needs user ID."
    );
  }

  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No context was provided."
    );
  }
  const caller = await auth.getUser(context.auth.uid);
  if (!caller.customClaims) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to delete users."
    );
  }
  const isAdmin = caller.customClaims.admin;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to delete users."
    );
  }

  try {
    const dbEntry = (await firestore.doc(`users/${uid}`).get()).data();
    const userExists = await auth.getUser(uid);
    if (!dbEntry || !userExists) {
      throw new functions.https.HttpsError(
        "not-found",
        "The specified user was not found."
      );
    }
    await auth.deleteUser(uid);
    return { success: true, msg: "Successfully removed user." };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error as string);
  }
});

export default removeUser;
