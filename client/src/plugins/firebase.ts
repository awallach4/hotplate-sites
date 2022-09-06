import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { initializeApp } from "firebase/app";
import { /*connectAuthEmulator,*/ getAuth } from "firebase/auth";
import {
  // connectFirestoreEmulator,
  getFirestore
} from "firebase/firestore/lite";
import { /*connectStorageEmulator,*/ getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import {
  clientFirebaseConfig,
  debugToken,
  recaptchaSiteKey
} from "../../../hotplateConfig";

export const app = initializeApp(clientFirebaseConfig);

// Uncomment the FIREBASE_APPCHECK_DEBUG_TOKEN statement for development mode only.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export const analytics = getAnalytics(app);
export const performance = getPerformance(app);

// Uncomment to use local emulators.
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(firestore, "localhost", 8000);
// connectStorageEmulator(storage, "localhost", 9199);
