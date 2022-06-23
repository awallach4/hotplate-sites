import type { FieldValue } from "firebase/firestore/lite";

export enum CheckboxIcons {
  CHECKED = "mdi-checkbox-marked",
  INDETERMINATE = "mdi-minus-box",
  UNCHECKED = "mdi-checkbox-blank-outline"
}

export interface VSelectValues {
  text: string;
  value: string;
}

export enum PermissionGroups {
  WEBMASTERS = "webmasters",
  USERS = "users",
  PUBLIC = "public",
  UNSET = ""
}

export interface PagesSpecialPageConfig {
  dbPath: string;
  id: string;
  index: number;
  name: string;
  permissions: PermissionGroups;
}

export interface SettingsSite {
  calEdit: PermissionGroups;
  calURL: string;
  calView: PermissionGroups;
  defaultPage: string;
  email: PermissionGroups;
  footerTxt: string;
  mailURL: string;
}

export interface SettingsSitePrivate {
  addresses: VSelectValues[];
  consoleURL: string;
  meetLink: string;
  linkHidden: boolean;
}

export enum AuthLevels {
  ADMIN = "Admin",
  WEBMASTER = "Webmaster",
  USER = "User",
  NONE = "None",
  UNSET = ""
}

export enum AuthStates {
  LOGGED_IN = "logged_in",
  LOGGED_OUT = "logged_out",
  LOGGING_IN = "logging_in"
}

export interface AuthUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  emailVerified: boolean;
}

export interface UserManagementUser {
  disabled: boolean;
  displayName: string;
  email: string;
  id: string;
  isSelectable: boolean;
  permissions: string;
  photoURL: string;
}

export interface EventData {
  password?: string;
  method: string;
  event?: string;
  title?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  description?: string;
  guests?: string;
  invite?: boolean;
}

export interface GoogleCalendarEvent {
  creator: {
    email: string;
  };
  description?: string;
  end?: {
    date?: string;
    dateTime?: string;
  };
  id: string;
  location?: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  summary: string;
}

export interface FullCalendarEvent {
  title: string;
  start: string;
  end: string;
  id: string;
  allDay: boolean;
  duration?: number;
  location?: string;
  description?: string;
  creator?: {
    email: string;
  };
  extendedProps?: {
    location?: string;
    description?: string;
    creator?: {
      email: string;
    };
  };
}

export interface EmailData {
  password?: string;
  to: string;
  subject: string;
  body: string;
  sender?: string;
  reply?: string;
}

export enum VThemeColors {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  ACCENT = "accent",
  ANCHOR = "anchor",
  SUCCESS = "success",
  WARNING = "warning",
  INFO = "info",
  ERROR = "error",
  CARD = "card",
  BACKGROUND = "background",
  PRIMARY_TEXT = "pritext",
  SECONDARY_TEXT = "sectext",
  ACCENT_TEXT = "acctext",
  SUCCESS_TEXT = "suctext",
  WARNING_TEXT = "warntext",
  INFO_TEXT = "infotext",
  ERROR_TEXT = "errtext",
  CARD_TEXT = "cardtext",
  BACKGROUND_TEXT = "bgtext"
}

export interface CompData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  props: {
    id: string;
    storPath: string;
    compType?: string;
  };
  index?: number;
  vueComp: string;
}

export interface PageData {
  components: CompData[];
}

export interface UploadedFile {
  name: string;
  url: string;
}

export interface MessageStreamMessageComment {
  name: string;
  uid: string;
  img: string | null;
  id: string;
  content: string;
  date: string;
}

export interface MessageStreamMessage {
  name: string;
  uid: string;
  id: string;
  img: string | null;
  files: UploadedFile[];
  content: string;
  date: string;
  comments: MessageStreamMessageComment[];
  createdAt?: FieldValue;
}

export interface ComponentMetaData {
  id: string;
  storPath: string;
}

export interface ItemListItem {
  content: string;
  id: string;
}

export interface SignupData {
  header: string;
  text: string;
  times: string[];
  multiple: boolean;
  enabled: boolean;
  roles: string[];
  id: string;
  useCard: boolean;
}

export interface VFormOptions extends HTMLFormElement {
  disabled: boolean;
  lazyValidation: boolean;
  readonly: boolean;
  value: boolean;
  validate(): boolean;
  reset(): void;
  resetValidation(): void;
}

export interface VTextFieldOptions extends HTMLInputElement {
  validate(): boolean;
  reset(): void;
  resetValidation(): void;
}
