import { initializeApp } from "firebase/app";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import defaultFirebaseConfig from "../firebase-applet-config.json";

let firebaseConfig: any = defaultFirebaseConfig;

if (typeof window !== "undefined") {
  const customConfigStr = window.localStorage.getItem("custom_firebase_config");
  if (customConfigStr) {
    try {
      const parsed = JSON.parse(customConfigStr);
      if (parsed && parsed.apiKey && parsed.projectId) {
        firebaseConfig = parsed;
        console.log("Using custom private Firebase project:", parsed.projectId);
      }
    } catch (e) {
      console.error("Failed to parse custom firebase config from localStorage", e);
    }
  }
}

const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbId); // Use database ID if specified with experimental long polling config, else use default instance
export const auth = getAuth(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed-precondition');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence unimplemented');
    }
  });
}
