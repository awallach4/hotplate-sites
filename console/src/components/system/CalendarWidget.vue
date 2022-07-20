<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Calendar"
    :header="retVal.header || 'Google Calendar (With Editor)'"
    class="calendar-widget"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-switch
        v-model="retVal.useCard"
        color="secondary"
        label="Create Card on Page"
      />
      <v-text-field
        v-model="retVal.header"
        color="secondary"
        filled
        label="Header"
        :disabled="dragging"
      />
      <template v-if="settings.useCalendar">
        <p>
          Times shown are in your local timezone.
          <br />
          <strong
            >Recurring events created through Google Calendar will not display
            properly here!</strong
          >
        </p>
        <v-card outlined :loading="active">
          <v-card-text class="cardtext--text">
            <strong
              v-if="error"
              style="color: var(--v-error-base); font-size: 1rem"
              >{{ error }}</strong
            >
            <v-spacer v-if="error" style="height: 12px" />
            <full-calendar :options="calendarOptions" />
            <v-menu
              v-model="selectedOpen"
              :activator="selectedElement"
              :close-on-content-click="false"
              min-width="300px"
              max-width="400px"
              offset-y
              class="event-card"
            >
              <calendar-widget-event
                :event="selectedEvent"
                :fetching-events="active"
                @close="selectedOpen = false"
                @edit="edit"
                @delete="remove"
              />
            </v-menu>
            <v-dialog v-model="eventCreator" persistent max-width="600">
              <v-card color="card">
                <v-toolbar color="primary">
                  <v-toolbar-title class="pritext--text"
                    >Event Creator</v-toolbar-title
                  >
                  <v-spacer />
                  <v-btn
                    aria-label="Close"
                    color="pritext"
                    :disabled="active"
                    icon
                    @click="close"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-toolbar>
                <v-card-title class="cardtext--text">New Event</v-card-title>
                <v-card-text class="cardtext--text">
                  <v-form
                    ref="eventForm"
                    :disabled="active"
                    @submit.prevent="addEvent"
                  >
                    <v-text-field
                      v-model="title"
                      filled
                      label="Event Name"
                      :counter="50"
                      :rules="[
                        fieldRequired,
                        maxLength(title, 50, 'Max 50 characters.')
                      ]"
                      color="secondary"
                    />
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model="startDate"
                          filled
                          label="Start Date"
                          type="date"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="endDate"
                          filled
                          label="End Date"
                          type="date"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                      <v-col v-if="!allDay" cols="6">
                        <v-text-field
                          v-model="startTime"
                          filled
                          label="Start Time"
                          type="time"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                      <v-col v-if="!allDay" cols="6">
                        <v-text-field
                          v-model="endTime"
                          filled
                          label="End Time"
                          type="time"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                    </v-row>
                    <v-switch
                      v-model="allDay"
                      color="secondary"
                      label="All Day"
                    />
                    <v-text-field
                      v-model="location"
                      filled
                      label="Event Location"
                      color="secondary"
                    />
                    <tiptap-editor
                      v-if="eventCreator"
                      v-model="desc"
                      placeholder="Event Description"
                      :disabled="active"
                      :use-img="false"
                    />
                    <v-spacer />
                    <v-select
                      v-model="guests"
                      :items="privateSettings.addresses"
                      label="Guests"
                      color="secondary"
                      item-color="secondary"
                      filled
                      multiple
                    >
                      <template #prepend-item>
                        <v-list-item ripple @click="toggle">
                          <v-list-item-action>
                            <v-icon
                              :color="guests.length > 0 ? 'secondary' : ''"
                              >{{ icon }}</v-icon
                            >
                          </v-list-item-action>
                          <v-list-item-content>
                            <v-list-item-title>Select All</v-list-item-title>
                          </v-list-item-content>
                        </v-list-item>
                        <v-divider class="mt-2" />
                      </template>
                      <template #selection="{ item, index }">
                        <v-chip v-if="index <= 5">
                          <span>{{ item.text }}</span>
                        </v-chip>
                        <span v-if="index === 5" class="grey--text caption"
                          >(+{{ guests.length - 5 }} others)</span
                        >
                      </template>
                    </v-select>
                    <v-switch
                      v-model="sendInvite"
                      color="secondary"
                      label="Send Invite"
                    />
                    <v-btn
                      color="secondary"
                      class="sectext--text"
                      block
                      type="submit"
                      :disabled="active"
                      >Create Event
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-dialog>
            <v-dialog v-model="eventEditor" persistent max-width="600">
              <v-card>
                <v-toolbar color="primary">
                  <v-toolbar-title class="pritext--text"
                    >Event Editor</v-toolbar-title
                  >
                  <v-spacer />
                  <v-btn
                    aria-label="Close"
                    icon
                    color="pritext"
                    :disabled="active"
                    @click="cancel"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-toolbar>
                <v-card-title class="cardtext--text">Edit Event</v-card-title>
                <v-card-text class="cardtext--text">
                  <v-form
                    ref="eventEditForm"
                    :disabled="active"
                    @submit.prevent="modify"
                  >
                    <v-text-field
                      v-model="editTitle"
                      filled
                      label="Event Name"
                      :counter="50"
                      :rules="[
                        fieldRequired,
                        maxLength(editTitle, 50, 'Max 50 characters.')
                      ]"
                      color="secondary"
                    />
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model="editStartDate"
                          filled
                          label="Start Date"
                          type="date"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model="editEndDate"
                          filled
                          label="End Date"
                          type="date"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                      <v-col v-if="!editAllDay" cols="6">
                        <v-text-field
                          v-model="editStartTime"
                          filled
                          label="Start Time"
                          type="time"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                      <v-col v-if="!editAllDay" cols="6">
                        <v-text-field
                          v-model="editEndTime"
                          filled
                          label="End Time"
                          type="time"
                          :rules="[fieldRequired]"
                          color="secondary"
                        />
                      </v-col>
                    </v-row>
                    <v-switch
                      v-model="editAllDay"
                      color="secondary"
                      label="All Day"
                    />
                    <v-text-field
                      v-model="editLocation"
                      filled
                      label="Event Location"
                      color="secondary"
                    />
                    <tiptap-editor
                      v-if="eventEditor"
                      v-model="editDesc"
                      placeholder="Event Description"
                      :disabled="active"
                      :use-img="false"
                    />
                    <v-spacer />
                    <v-btn
                      color="secondary"
                      class="sectext--text"
                      block
                      type="submit"
                      :disabled="active"
                      >Update Event
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-card-text>
        </v-card>
      </template>
      <template v-else>
        <strong>The calendar service is not enabled.</strong>
      </template>
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import "@fullcalendar/core/vdom";
import FullCalendar, { type EventClickArg } from "@fullcalendar/vue";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg
} from "@fullcalendar/interaction";
import sanitized from "@/plugins/dompurify";
import {
  CheckboxIcons,
  type EventData,
  type FullCalendarEvent,
  type VFormOptions
} from "@/types";
import {
  editGoogleCalendar,
  getGoogleCalendarEvents
} from "@/plugins/calendarService";
import { computed, onMounted, ref, type Ref } from "@vue/composition-api";
import { fieldRequired, maxLength } from "@/plugins/formRules";
import { settings, privateSettings } from "@/plugins/routerStoreHelpers";

interface CalendarEditorData {
  useCard: boolean;
  hidden: boolean;
  header: string;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  value: CalendarEditorData;
}

interface Emits {
  (e: "input", payload: CalendarEditorData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  value: () => {
    return {
      useCard: true,
      header: "",
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const eventCreator = ref(false);
const eventEditor = ref(false);
const active = ref(false);
const title = ref("");
const startDate = ref("");
const startTime = ref("");
const endDate = ref("");
const endTime = ref("");
const location = ref("");
const desc = ref("");
const allDay = ref(true);
const guests: Ref<string[]> = ref([]);
const sendInvite = ref(true);
const editTitle = ref("");
const editStartDate = ref("");
const editStartTime = ref("");
const editEndDate = ref("");
const editEndTime = ref("");
const editLocation = ref("");
const editDesc = ref("");
const editAllDay = ref(true);
const selectedEvent: Ref<FullCalendarEvent> = ref({} as FullCalendarEvent);
const selectedElement: Ref<HTMLElement | null> = ref(null);
const selectedOpen = ref(false);
const error = ref("");
const eventForm = ref({} as VFormOptions);
const eventEditForm = ref({} as VFormOptions);

const icon = computed(() => {
  if (
    privateSettings.value.addresses &&
    guests.value.length === privateSettings.value.addresses.length
  ) {
    return CheckboxIcons.CHECKED;
  } else if (
    privateSettings.value.addresses &&
    guests.value.length > 0 &&
    guests.value.length !== privateSettings.value.addresses.length
  ) {
    return CheckboxIcons.INDETERMINATE;
  } else {
    return CheckboxIcons.UNCHECKED;
  }
});

const newEvent = (input: DateClickArg) => {
  startDate.value = input.dateStr.slice(0, 10);
  startTime.value = input.dateStr.slice(11, 19);
  endDate.value = input.dateStr.slice(0, 10);
  if (!input.allDay) {
    allDay.value = false;
    endTime.value = new Date(new Date(input.dateStr).valueOf() + 3600000)
      .toTimeString()
      .slice(0, 8);
  } else {
    allDay.value = true;
  }

  eventCreator.value = true;
};

const close = () => {
  title.value = "";
  startDate.value = "";
  startTime.value = "";
  endDate.value = "";
  endTime.value = "";
  location.value = "";
  desc.value = "";
  guests.value = [];
  sendInvite.value = true;
  eventForm.value.resetValidation();
  eventCreator.value = false;
};

const openInfo = (info: EventClickArg) => {
  const open = () => {
    selectedEvent.value = {
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      extendedProps: info.event.extendedProps,
      allDay: info.event.allDay,
      id: info.event.id
    };
    selectedElement.value = info.el;
    setTimeout(() => (selectedOpen.value = true), 10);
  };

  if (selectedOpen.value) {
    selectedOpen.value = false;
    setTimeout(open, 10);
  } else {
    open();
  }
};

const getEvents = async () => {
  try {
    active.value = true;
    const events = await getGoogleCalendarEvents();
    active.value = false;
    return events;
  } catch (err) {
    error.value = err as string;
    active.value = false;
    return [];
  }
};

const calendarOptions = ref({
  plugins: [dayGridPlugin, listPlugin, timeGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  events: [] as FullCalendarEvent[],
  navLinks: true,
  nowIndicator: true,
  headerToolbar: {
    start: "refresh today prev next",
    center: "title",
    end: "dayGridMonth timeGridWeek timeGridDay listMonth"
  },
  footerToolbar: {
    end: "downloadFile addGC"
  },
  buttonIcons: {
    prev: "v-icon v-icon mdi mdi-chevron-left",
    next: "v-icon v-icon mdi mdi-chevron-right"
  },
  customButtons: {
    addGC: {
      text: "Add to Google Calendar",
      click(): void {
        window.open(
          `https://www.google.com/calendar/render?cid=${encodeURI(
            settings.value.calID
          )}`,
          "_blank"
        );
      }
    },
    downloadFile: {
      text: "Download .ics",
      click(): void {
        window.open(
          `https://calendar.google.com/calendar/ical/${encodeURI(
            settings.value.calID
          )}/public/basic.ics`,
          "_blank"
        );
      }
    },
    refresh: {
      icon: "v-icon v-icon mdi mdi-refresh",
      click: async (): Promise<void> => {
        const events = await getEvents();
        calendarOptions.value.events = events;
      }
    }
  },
  buttonText: {
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    list: "List"
  },
  eventColor: "var(--v-primary-base)",
  eventTextColor: "var(--v-pritext-base)",
  eventClick: openInfo,
  dateClick: (info: DateClickArg): void => {
    newEvent(info);
  }
});

const addEvent = async () => {
  const isValid = eventForm.value.validate();
  if (!isValid) {
    return;
  }
  active.value = true;
  const postData = {
    title: title.value,
    location: location.value,
    description: sanitized(desc.value),
    guests: guests.value.join(),
    invite: sendInvite.value,
    id: settings.value.calID
  } as EventData;
  if (allDay.value) {
    if (endDate.value) {
      postData.method = "createAllDayEvent";
      postData.start = `${startDate.value}T00:00:00`;
      postData.end = new Date(new Date(endDate.value).valueOf() + 86400000)
        .toJSON()
        .slice(0, 19);
    } else {
      postData.method = "createAllDayEvent";
      postData.start = `${startDate.value}T00:00:00`;
    }
  } else {
    postData.method = "createEvent";
    postData.start = `${startDate.value}T${startTime.value}`;
    postData.end = `${endDate.value}T${endTime.value}`;
  }

  try {
    await editGoogleCalendar(postData);
    const events = await getEvents();
    calendarOptions.value.events = events;
    close();
    active.value = false;
  } catch (err) {
    error.value = err as string;
    active.value = false;
  }
};

const remove = async () => {
  active.value = true;
  selectedOpen.value = false;
  const postData: EventData = {
    method: "deleteEvent",
    event: selectedEvent.value.id,
    id: settings.value.calID
  };
  try {
    await editGoogleCalendar(postData);
    const events = await getEvents();
    calendarOptions.value.events = events;
    selectedEvent.value = {} as FullCalendarEvent;
    active.value = false;
  } catch (err) {
    error.value = err as string;
    active.value = false;
  }
};

const edit = () => {
  eventEditor.value = true;
  selectedOpen.value = false;
  editTitle.value = selectedEvent.value.title;
  editAllDay.value = selectedEvent.value.allDay;
  if (editAllDay.value) {
    editStartDate.value = selectedEvent.value.start.slice(0, 10) || "";
    editEndDate.value =
      new Date(
        new Date(selectedEvent.value.end.slice(0, 10)).valueOf() - 86400000
      )
        .toISOString()
        .slice(0, 10) || "";
  } else {
    editStartDate.value = selectedEvent.value.start.slice(0, 10) || "";
    editStartTime.value = selectedEvent.value.start.slice(11, 19) || "";
    editEndDate.value = selectedEvent.value.end.slice(0, 10) || "";
    editEndTime.value = selectedEvent.value.end.slice(11, 19) || "";
  }
  if (selectedEvent.value.extendedProps) {
    editLocation.value = selectedEvent.value.extendedProps.location || "";
    editDesc.value = selectedEvent.value.extendedProps.description || "";
  }
};

const cancel = () => {
  editTitle.value = "";
  editStartDate.value = "";
  editStartTime.value = "";
  editEndDate.value = "";
  editEndTime.value = "";
  editLocation.value = "";
  editDesc.value = "";
  eventEditForm.value.resetValidation();
  eventEditor.value = false;
};

const modify = async () => {
  const isValid = eventEditForm.value.validate();
  if (!isValid) {
    return;
  }

  active.value = true;
  selectedOpen.value = false;
  const postData: EventData = {
    method: "editEvent",
    allDay: editAllDay.value,
    event: selectedEvent.value.id,
    title: editTitle.value,
    location: editLocation.value,
    description: sanitized(editDesc.value),
    id: settings.value.calID
  };
  if (editAllDay.value) {
    if (editEndDate.value) {
      postData.start = `${editStartDate.value}T00:00:00`;
      postData.end = new Date(new Date(editEndDate.value).valueOf() + 86400000)
        .toJSON()
        .slice(0, 19);
    } else {
      postData.start = `${editStartDate.value}T00:00:00`;
    }
  } else {
    postData.start = `${editStartDate.value}T${editStartTime.value}`;
    postData.end = `${editEndDate.value}T${editEndTime.value}`;
  }

  try {
    await editGoogleCalendar(postData);
    const events = await getEvents();
    calendarOptions.value.events = events;
    cancel();
    active.value = false;
  } catch (err) {
    error.value = err as string;
    active.value = false;
  }
};

const toggle = () => {
  if (
    privateSettings.value.addresses &&
    guests.value.length >= privateSettings.value.addresses.length
  ) {
    guests.value = [];
  } else if (
    privateSettings.value.addresses &&
    guests.value.length < privateSettings.value.addresses.length
  ) {
    if (privateSettings.value.addresses.length > 0) {
      guests.value = [];
      privateSettings.value.addresses.forEach((address) => {
        guests.value.push(address.value);
      });
    }
  }
};

const deleteSelf = (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  Remember to save for this change to take effect!"
      )
    ) {
      return;
    }
  }

  emit("delete");
};

defineExpose({ deleteSelf });

onMounted(async () => {
  const events = await getEvents();
  calendarOptions.value.events = events;
  emit("input", retVal.value);
});
</script>

<style lang="scss">
.fc *:before,
.fc *:after {
  vertical-align: bottom;
}

.fc-view-harness {
  height: 600px !important;
}

.fc-button {
  background-color: var(--v-primary-base) !important;
  color: var(--v-pritext-base) !important;
  border: none !important;
}

.fc-button:disabled {
  cursor: default;
}

.fc-header-toolbar {
  flex-flow: row wrap;
}

.fc-toolbar-chunk {
  margin: 5px 0;
}

.theme--dark .fc-list-day-cushion {
  background-color: var(--v-background-lighten1);
}

.theme--light .fc-list-day-cushion {
  background-color: var(--v-background-darken1);
}

.theme--light .fc-list-event:hover td {
  background-color: var(--v-background-darken2);
}

.theme--dark .fc-list-event:hover td {
  background-color: var(--v-background-lighten2);
}
</style>
