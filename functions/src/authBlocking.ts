import { firestore } from "./admin";
import * as functions from "firebase-functions";

export const beforeCreate = functions.auth.user().beforeCreate(async (user) => {
  const existingAdmins = await firestore
    .collection("users")
    .where("permissions", "==", "Admin")
    .get();
  if (existingAdmins.size < 1) {
    const authorizedAccounts = await firestore
      .collection("new-users")
      .where("email", "==", user.email)
      .where("newAdmin", "==", true)
      .get();
    if (authorizedAccounts.size < 1) {
      await firestore.doc(`users/${user.uid}`).set({
        disabled: false,
        permissions: "User",
        email: user.email
      });
      return {};
    } else {
      functions.logger.log(
        "No admin accounts found.  Creating first admin account..."
      );
      authorizedAccounts.forEach((doc) => {
        doc.ref.delete();
      });
      await firestore.doc(`users/${user.uid}`).set({
        disabled: false,
        permissions: "Admin",
        email: user.email
      });
      return {
        customClaims: {
          admin: true,
          webmaster: true
        }
      };
    }
  } else {
    const settings = await firestore.doc("configuration/settings").get();
    const data = settings.data();
    if (data && data.controlledAuth) {
      const email = user.email;

      const matchingUsers = await firestore
        .collection("new-users")
        .where("email", "==", email)
        .get();
      if (matchingUsers.size < 1) {
        throw new functions.auth.HttpsError(
          "permission-denied",
          "The given email address has not been invited to create an account."
        );
      } else {
        matchingUsers.forEach((doc) => {
          doc.ref.delete();
        });

        await firestore.doc(`users/${user.uid}`).set({
          email: user.email,
          permissions: "User",
          disabled: false
        });
        return {};
      }
    } else {
      await firestore.doc(`users/${user.uid}`).set({
        email: user.email,
        permissions: "User",
        disabled: false
      });
      return {};
    }
  }
});
