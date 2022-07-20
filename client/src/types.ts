import type { FieldValue } from "firebase/firestore/lite";

export enum CheckboxIcons {
  CHECKED = "mdi-checkbox-marked",
  INDETERMINATE = "mdi-minus-box",
  UNCHECKED = "mdi-checkbox-blank-outline"
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
  data: any;
  props: {
    id: string;
    storPath: string;
  };
  index: number;
  vueComp: string;
}

export interface PageData {
  components: CompData[];
}

export enum PermissionGroups {
  WEBMASTERS = "webmasters",
  USERS = "users",
  PUBLIC = "public",
  UNSET = ""
}

export interface PageConfig {
  dbPath: string;
  id: string;
  index: number;
  name: string;
  permissions: PermissionGroups;
}

export interface VSelectValues {
  text: string;
  value: string;
}

export interface UploadedFile {
  name: string;
  url: string;
}

export interface SettingsSite {
  calEdit: PermissionGroups;
  calID: string;
  calURL: string;
  calView: PermissionGroups;
  controlledAuth: boolean;
  defaultPage: string;
  email: PermissionGroups;
  footerTxt: string;
  mailURL: string;
  useCalendar: boolean;
  useEmail: boolean;
}

export interface SettingsSitePrivate {
  addresses: VSelectValues[];
  consoleURL: string;
  meetLink: string;
  useMeeting: boolean;
}

export interface MessageStreamMessageComment {
  name: string;
  uid: string;
  img: string;
  id: string;
  content: string;
  date: string;
}

export interface MessageStreamMessage {
  name: string;
  uid: string;
  id: string;
  img: string;
  files: UploadedFile[];
  content: string;
  date: string;
  comments: MessageStreamMessageComment[];
  createdAt?: FieldValue;
}

export enum AlertMessageTypes {
  SUCCESS = "success",
  INFORMATION = "info",
  WARNING = "warning",
  ERROR = "error"
}

export enum VAlertIconTypes {
  SUCCESS = "mdi-check-circle-outline",
  INFORMATION = "mdi-information-outline",
  WARNING = "mdi-alert-outline",
  ERROR = "mdi-alert-octagon-outline"
}

export enum LayoutOptions {
  TWO_COLUMNS = "twoCol",
  THREE_COLUMNS = "threeCol"
}

export interface HeaderData {
  head: string;
  sub: string;
  fullPage: boolean;
  storPath: string;
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
  hidden: boolean;
  created?: FieldValue;
}

export interface SignupItem {
  role: string;
  name: string;
  comments: string;
  uid: string;
  shift: string;
  email: string;
  key: string;
  time?: FieldValue;
}

export interface SignupSheetCollectionData {
  readonly sheets: SignupData[];
  readonly hidden: boolean;
}

export interface ComponentMetaData {
  id: string;
  storPath: string;
}

export interface GoogleCalendarEvent {
  description?: string;
  end?: {
    date?: string;
    dateTime?: string;
  };
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
  allDay: boolean;
  duration?: number;
  location?: string;
  description?: string;
  extendedProps?: {
    location?: string;
    description?: string;
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

export enum AuthLevels {
  ADMIN = "Admin",
  WEBMASTER = "Webmaster",
  USER = "User",
  NONE = "None"
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

export interface UserData {
  authorized: boolean;
  disabled: boolean;
  displayName: string;
  email: string;
  permissions: AuthLevels;
  photoURL: string;
}

export interface ItemListItem {
  content: string;
  id: string;
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
