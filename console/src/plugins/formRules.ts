export const fieldRequired = (value: string): true | string =>
  !!value || "Required.";
export const validEmail = (value: string): true | string => {
  const pattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(value) || "Invalid email address.";
};
export const minValue = (
  value: number,
  min: number,
  message: string
): true | string => (value && value >= min) || message;
export const maxValue = (
  value: number,
  max: number,
  message: string
): true | string => (value && value <= max) || message;

export const minLength = (
  value: string | unknown[],
  min: number,
  message: string
): true | string => (value && value.length >= min) || message;

export const maxLength = (
  value: string | unknown[],
  max: number,
  message: string
): true | string => (value && value.length <= max) || message;

export const notIncludes = (value: string): true | string => {
  const pattern = /[/\\[\]{}()]/g;
  return (
    !pattern.test(value) ||
    'Page names cannot include "/", "\\", "[", "]", "{", "}", "(", or ")".'
  );
};

export const noSpace = (value: string): true | string => {
  const pattern = /\s{2,}/g;
  return (
    !pattern.test(value) ||
    "Page name cannot include more than 1 space between characters."
  );
};

export const noTrail = (value: string): true | string => {
  const pattern = /^\s|\s$|^-|-$|^_|_$/g;
  return (
    !pattern.test(value) ||
    "Page name cannot begin or end with a space, _, or -."
  );
};
