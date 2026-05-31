export { getFirebaseApp, getFirebaseConfig } from "./config";
export {
  auth,
  getFirebaseAuth,
  googleProvider,
  waitForAuthReady,
  subscribeToAuthState,
  fetchUserRole,
  getUserRole,
  fetchCurrentRole,
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  logoutUser,
  sendPasswordReset,
  type AppRole,
  type SignupRole,
} from "./auth";
export { db, getDb } from "./firestore";
export {
  getFirebaseStorage,
  uploadUserFile,
  uploadPendingProductImage,
  uploadProductImage,
  uploadStoreLogo,
  deleteStoreLogo,
  deleteStorageFile,
  deleteProductImage,
  deleteUserFile,
  validateImageFile,
  validateLogoFile,
  type UploadProgressHandler,
} from "./storage";
