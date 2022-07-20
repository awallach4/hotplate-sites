import { useSettings } from "@/store/settings";
import { PermissionGroups, type EmailData } from "@/types";
import { computed } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";
import { isAuthorized, isWebmaster } from "./authHandler";
import { getFirestoreError } from "./errorHandler";

export const canMail = computed(() => {
  const SettingsModule = useSettings();
  const perms = SettingsModule.siteSettings.email;
  if (perms === PermissionGroups.WEBMASTERS) {
    return isWebmaster.value && isAuthorized.value;
  } else if (perms === PermissionGroups.USERS) {
    return isAuthorized.value;
  } else {
    return false;
  }
});

/**
 * Sends an email using the Apps Script Email Service.
 * @async
 * @function sendEmail
 * @param {EmailData} postData The data to send to the server.
 * @returns {Promise<void>} Nothing.
 */
export const sendEmail = async (postData: EmailData): Promise<void> => {
  const SettingsModule = useSettings();
  const script = SettingsModule.siteSettings.mailURL;
  if (!script) {
    throw new Error("No email service script was found.");
  }
  try {
    const { firestore } = await import("./firebase");
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const passwordDoc = await getDoc(
      doc(firestore, "configuration/apps-script-mail")
    );
    const data = passwordDoc.data();
    if (data) {
      postData.password = data.password;
    } else {
      postData.password = "";
    }
  } catch (error) {
    throw new Error(
      `An error occurred while getting the script password: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }

  const http = await fetch(script, {
    method: "POST",
    body: JSON.stringify(postData)
  });

  if (!http.ok) {
    throw new Error(
      `Could not send the email.  The server responded with code ${http.status}.`
    );
  }

  const response = await http.json();

  if (response.error) {
    throw new Error(`The server responded with an error: ${response.error}`);
  }
  if (Math.random() * 100 > 50) {
    const { generateString } = await import("./stringGenerator");
    const { firestore } = await import("./firebase");
    const { doc, updateDoc } = await import("firebase/firestore/lite");
    await updateDoc(doc(firestore, "configuration/apps-script-mail"), {
      password: generateString(20)
    });
  }
};
