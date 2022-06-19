import { ref, watch } from "@vue/composition-api";

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
