import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    type Auth,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAUlo70jcDmlVjFd_Mg5x6AzzUkQLHiGeU",
    authDomain: "knullvoid-446c1.firebaseapp.com",
    projectId: "knullvoid-446c1",
    storageBucket: "knullvoid-446c1.firebasestorage.app",
    messagingSenderId: "348987910833",
    appId: "1:348987910833:web:e4f5aa644ddafe0c759090",
    measurementId: "G-PN0HRG65NN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Helper: Sign in with Google popup
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Helper: Send password reset email
export const resetPassword = (email: string) =>
    sendPasswordResetEmail(auth, email);

export default app;
