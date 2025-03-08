
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Read the service account key file
const serviceAccount = JSON.parse(
  readFileSync(new URL("./agriculture-supply-chain-firebase-adminsdk-1snhk-1f021bdaed.json", import.meta.url))
);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://agriculture-supply-chain-default-rtdb.firebaseio.com/", // Replace with your Firebase Realtime Database URL
});

const db = admin.database();
export default db;
