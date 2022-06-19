import { auth, firestore } from "./admin";
import * as functions from "firebase-functions";

const setPermissions = functions.https.onCall(async (data, context) => {
  if (context.app === undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app."
    );
  }
  const uid: string = data.uid;
  const perms: string = data.perms;
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
      "You are not authorized to change user permissions."
    );
  }
  const isAdmin = caller.customClaims.admin;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to change user permissions."
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
    switch (perms) {
      case "Admin": {
        await auth.setCustomUserClaims(uid, {
          authorized: true,
          webmaster: true,
          admin: true
        });
        await auth.revokeRefreshTokens(uid);
        break;
      }
      case "Webmaster": {
        await auth.setCustomUserClaims(uid, {
          authorized: true,
          webmaster: true,
          admin: false
        });
        await auth.revokeRefreshTokens(uid);
        break;
      }
      case "User": {
        await auth.setCustomUserClaims(uid, {
          authorized: true,
          webmaster: false,
          admin: false
        });
        await auth.revokeRefreshTokens(uid);
        break;
      }
      default: {
        await auth.setCustomUserClaims(uid, {
          authorized: true,
          webmaster: false,
          admin: false
        });
        auth.revokeRefreshTokens(uid);
      }
    }

    await firestore.doc(`users/${uid}`).update({
      permissions: perms
    });
    return { success: true, msg: "Successfully set permissions." };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error as string);
  }
});

export default setPermissions;
