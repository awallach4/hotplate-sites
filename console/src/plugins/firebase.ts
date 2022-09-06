import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { /*connectAuthEmulator,*/ getAuth } from "firebase/auth";
import {
  // connectFirestoreEmulator,
  getFirestore
} from "firebase/firestore/lite";
import { /*connectStorageEmulator,*/ getStorage } from "firebase/storage";
import { /*connectFunctionsEmulator,*/ getFunctions } from "firebase/functions";
import { getPerformance } from "firebase/performance";
import {
  consoleFirebaseConfig,
  // debugToken,
  recaptchaSiteKey
} from "../../../hotplateConfig";

export const app = initializeApp(consoleFirebaseConfig);

// Uncomment the FIREBASE_APPCHECK_DEBUG_TOKEN statement for development mode only.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const performance = getPerformance(app);

// Uncomment to use local emulators.
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(firestore, "localhost", 8000);
// connectStorageEmulator(storage, "localhost", 9199);
// connectFunctionsEmulator(functions, "localhost", 5001);
