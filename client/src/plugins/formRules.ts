export const fieldRequired = (value: string): true | string =>
  !!value || "Required.";
export const validEmail = (value: string): true | string => {
  const pattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(value) || "Invalid email address.";
};
export const minLength = (
  value: string | unknown[],
  min: number,
  message: string
): true | string => (value && value.length >= min) || message;

export const minValue = (
  value: number,
  min: number,
  message: string
): true | string => (value && value >= min) || message;
export const matchStrings = (value: string, compare: string): true | string =>
  (!!value && value) === compare || "New passwords must match.";
export const includes = (value: string): true | string => {
  const pattern = /[A-Z]/;
  const pattern2 = /[a-z]/;
  const pattern3 = /[0-9]/;
  return (
    (pattern.test(value) && pattern2.test(value) && pattern3.test(value)) ||
    "Your password must include at least one uppercase, lowercase, and number character."
  );
};
