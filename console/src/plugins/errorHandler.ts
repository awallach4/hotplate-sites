import type { AuthError } from "firebase/auth";
import type { StorageError } from "firebase/storage";
import { ref, watch } from "vue";
import type { FirestoreError } from "firebase/firestore/lite";

/**
 * Whether the snackbar alert is visible.
 * @constant pageAlertState
 */
export const pageAlertState = ref(false);

/**
 * The snackbar alert message.
 * @constant pageAlertMessage
 */
export const pageAlertMessage = ref("");

watch(pageAlertState, (newValue) => {
  if (!newValue) {
    pageAlertMessage.value = "";
  }
});

/**
 * Creates a popup snackbar alert at the bottom of the screen.
 * @function displayPageAlert
 * @param message The message to display in the alert.
 * @returns Nothing.
 */
export const displayPageAlert = (message: string) => {
  pageAlertMessage.value = message;
  pageAlertState.value = true;
};

/**
 * Converts Firebase Auth error codes to user-friendly messages.
 * @function getAuthError
 * @param {AuthError} error The Firebase error message.
 * @returns {string} A user-friendly error message.
 */
export const getAuthError = (error: AuthError): string => {
  switch (error.code) {
    case "auth/admin-restricted-operation":
      return "This operation is restricted to administrators only.";
    case "auth/argument-error":
      return 'An unknown error occurred.  Please contact a site administrator with the code "auth/argument-error" and when the error occurred.';
    case "auth/app-not-authorized":
      return "This app is not authorized for authentication.  Please contact a site administrator.";
    case "auth/cors-unsupported":
      return "This browser is not supported.";
    case "auth/credential-already-in-use":
      return "This credential is already associated with a different user account.";
    case "auth/requires-recent-login":
      return "This operation is sensitive and requires recent authentication. Log in again before retrying this request.";
    case "auth/email-already-in-use":
      return "The email address is already in use by another account.";
    case "auth/internal-error":
      return "An internal error has occurred.";
    case "auth/invalid-user-token":
      return "This user is invalid for this site.";
    case "auth/invalid-auth-event":
      return "An internal error has occurred.";
    case "auth/invalid-email":
      return "The email address is badly formatted.";
    case "auth/invalid-api-key":
      return "The API key is invalid.  Please contact a site administrator.";
    case "auth/invalid-cert-hash":
      return "The SHA-1 certificate hash provided is invalid.  Please contact a site administrator.";
    case "auth/invalid-credential":
      return "The supplied auth credential is malformed or has expired.";
    case "auth/invalid-message-payload":
      return "The email template corresponding to this action contains invalid characters in its message. Please contact a site administrator with the action you were trying to perform.";
    case "auth/wrong-password":
      return "Your password is incorrect.";
    case "auth/invalid-persistence-type":
      return "The specified persistence type is invalid. It can only be local, session or none.";
    case "auth/invalid-recipient-email":
      return "The email corresponding to this action failed to send as the provided recipient email address is invalid.";
    case "auth/invalid-sender":
      return "The email template corresponding to this action contains an invalid sender email or name. Please contact a site administrator with the action you were trying to perform.";
    case "auth/invalid-tenant-id":
      return "The Auth instance's tenant ID is invalid.  Please contact a site administrator for assistance.";
    case "auth/auth-domain-config-required":
      return 'An unexpected error occurred.  Please contact a site administrator with the code "auth/auth-domain-config-required" for assistance.';
    case "auth/missing-iframe-start":
      return "An internal error has occurred.";
    case "auth/missing-or-invalid-nonce":
      return "The request does not contain a valid nonce. Please contact a site administrator for assistance.";
    case "auth/app-deleted":
      return 'An unexpected error occurred.  Please contact a site administrator with the code "auth/app-deleted" for assistance.';
    case "auth/network-request-failed":
      return "A network error occurred.  Please check your internet connection.";
    case "auth/no-auth-event":
      return "An internal error has occurred.";
    case "auth/null-user":
      return "A null user object was provided as the argument for an operation which requires a non-null user object.";
    case "auth/operation-not-supported-in-this-environment":
      return 'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.';
    case "auth/quota-exceeded":
      return "The quota for this operation has been exceeded.  Please try again later.";
    case "auth/rejected-credential":
      return "The request contains malformed or mismatching credentials.";
    case "auth/tenant-id-mismatch":
      return "The provided tenant ID does not match the Auth instance's tenant ID.  Please contact a site administrator for assistance.";
    case "auth/timeout":
      return "The operation has timed out.";
    case "auth/user-token-expired":
      return "The user's credential is no longer valid. The user must sign in again.";
    case "auth/too-many-requests":
      return "We have blocked all requests from this device due to unusual activity.  Please try again later.";
    case "auth/unsupported-persistence-type":
      return "The current environment does not support the specified persistence type.";
    case "auth/unsupported-tenant-operation":
      return "This operation is not supported in a multi-tenant context.  Please contact a site administrator for assistance.";
    case "auth/unverified-email":
      return "The operation requires a verified email.";
    case "auth/user-not-found":
      return "There is no user record corresponding to this identifier. The user may have been deleted.";
    case "auth/user-disabled":
      return "The user account has been disabled by an administrator.";
    case "auth/user-mismatch":
      return "The supplied credentials do not correspond to the previously signed in user.";
    case "auth/user-signed-out":
      return "No user is signed in.";
    case "auth/weak-password":
      return "The password must be 6 characters long or more.";
    case "auth/web-storage-unsupported":
      return "This browser is not supported or 3rd party cookies and data may be disabled.";
    default:
      return error.code;
  }
};

/**
 * Converts Firestore error codes to user-friendly messages.
 * @function getAuthError
 * @param {AuthError} error The Firebase error message.
 * @returns {string} A user-friendly error message.
 */
export const getFirestoreError = (error: FirestoreError): string => {
  switch (error.code) {
    case "cancelled":
      return "The operation was cancelled.";
    case "unknown":
      return "An unknown error has occurred.";
    case "invalid-argument":
      return "An invalid field name or document path was specified in your request.";
    case "deadline-exceeded":
      return "Your request timed out.  Please try again.";
    case "not-found":
      return "The requested resource could not be found.";
    case "already-exists":
      return "The document you requested to create already exists.";
    case "permission-denied":
      return "You do not have permission to perform this operation.";
    case "resource-exhausted":
      return "The quota for this operation has been exceeded.  Please try again later.";
    case "failed-precondition":
      return "The operation could not be completed.";
    case "aborted":
      return "The operation was aborted by the server.";
    case "out-of-range":
      return "The data provided is out of the valid range.";
    case "unimplemented":
      return "The operation is not supported.";
    case "internal":
      return "An internal error occurred.";
    case "unavailable":
      return "The requested service is currently unavailable.  Please try again later.";
    case "data-loss":
      return "The database for this site has been corrupted.  Please contact a site administrator.";
    case "unauthenticated":
      return "You are not authenticated to perform this operation.";
    default:
      return error.code;
  }
};

/**
 * Converts Firebase Storage error codes to user-friendly messages.
 * @function getAuthError
 * @param {AuthError} error The Firebase error message.
 * @returns {string} A user-friendly error message.
 */
export const getStorageError = (error: StorageError): string => {
  switch (error.code) {
    case "storage/unknown":
      return "An unknown error occurred.";
    case "storage/object-not-found":
      return "The requested file was not found.";
    case "storage/bucket-not-found":
      return "The storage bucket for this website is not configured.  Please contact a site administrator.";
    case "storage/project-not-found":
      return "The storage bucket for this website is not configured.  Please contact a site administrator.";
    case "storage/quota-exceeded":
      return "The quota for the storage bucket for this website has been exceeded.  Please try again later.";
    case "storage/unauthenticated":
      return "You are not authenticated to perform this operation.";
    case "storage/unauthorized":
      return "You do not have permission to perform this operation.";
    case "storage/retry-limit-exceeded":
      return "Your request timed out.  Please try again.";
    case "storage/invalid-checksum":
      return "The file failed to upload.  Please try again.";
    case "storage/canceled":
      return "The operation was canceled.";
    case "storage/invalid-event-name":
      return "Invalid event name provided. Must be one of [`running`, `progress`, `pause`].";
    case "storage/invalid-url":
      return "The URL provided is not valid.";
    case "storage/invalid-argument":
      return "Something seems wrong with the file you provided.  Please try again.";
    case "storage/no-default-bucket":
      return "No default storage bucket has been set.  Please contact a site administrator.";
    case "storage/cannot-slice-blob":
      return "Something went wrong with your file.  Please try uploading it again.";
    case "storage/server-file-wrong-size":
      return "The file failed to upload.  Please try again.";
    default:
      return error.code;
  }
};
