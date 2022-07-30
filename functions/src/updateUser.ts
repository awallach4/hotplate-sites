import { auth, firestore } from "./admin";
import * as functions from "firebase-functions";

const updateUser = functions.https.onCall(async (data, context) => {
  if (context.app === undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app."
    );
  }
  const uid: string = data.uid;
  const mode: string = data.mode;
  const content = data.content;
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
      "You are not authorized to modify user accounts."
    );
  }
  const isAdmin = caller.customClaims.admin;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to modify user accounts."
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
    if (mode === "disable") {
      if (typeof content !== "boolean") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "The request data (content parameter) must be true or false."
        );
      }
      await auth.updateUser(uid, {
        disabled: content
      });
      await firestore.doc(`users/${uid}`).update({
        disabled: content
      });
      return { success: true, msg: "Successfuly toggled disabled state." };
    } else if (mode === "name") {
      if (typeof content !== "string") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "The request data (content parameter) must be a string."
        );
      }
      await auth.updateUser(uid, {
        displayName: content
      });
      await firestore.doc(`users/${uid}`).update({
        displayName: content
      });
      return { success: true, msg: "Successfully updated username." };
    } else if (mode === "signout") {
      await auth.revokeRefreshTokens(uid);
      return { success: true, msg: "Successfully signed out the user." };
    } else {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No valid mode was specified."
      );
    }
  } catch (error) {
    throw new functions.https.HttpsError("internal", error as string);
  }
});

export default updateUser;
