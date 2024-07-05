import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Add Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLqGjRDP5KN-8HeXIYF_8cse4OWj_UoII",
  authDomain: "least-count-68abd.firebaseapp.com",
  databaseURL: "https://least-count-68abd-default-rtdb.firebaseio.com/",
  projectId: "least-count-68abd",
  storageBucket: "least-count-68abd.appspot.com",
  messagingSenderId: "305454990537",
  appId: "1:305454990537:web:b34fbf4b7eaea452b8b918",
  measurementId: "G-F81V587S7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const firestore = getFirestore(app); // Initialize Firestore

export { db, auth, firestore };
