<template>
  <card-wrap :is-elevated="useCard" :header="header" class="calendar-widget">
    <template v-if="settings.calURL">
      <p>
        Times shown are in your local timezone.
        <br />
        <strong
          >Recurring events created through Google Calendar will not display
          properly here!</strong
        >
      </p>
      <v-card outlined :loading="active">
        <v-card-text>
          <strong v-if="errmsg" class="error--text normal-text">{{
            errmsg
          }}</strong>
          <v-spacer v-if="errmsg" style="height: 12px" />
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
              @close="selectedOpen = false"
            />
          </v-menu>
        </v-card-text>
      </v-card>
    </template>
    <template v-else>
      <strong
        >We're sorry, but the calendar service script URL was not found. Please
        contact a site administrator for assistance.</strong
      >
    </template>
  </card-wrap>
</template>

<script lang="ts" setup>
import "@fullcalendar/core/vdom";
import type { EventClickArg } from "@fullcalendar/vue";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useSettings } from "@/store/settings";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  ref,
  type Ref
} from "@vue/composition-api";
import type { FullCalendarEvent } from "@/types";

interface Props {
  useCard?: boolean;
  header?: string;
}

withDefaults(defineProps<Props>(), {
  useCard: true,
  header: ""
});

const FullCalendar = defineAsyncComponent(() => import("@fullcalendar/vue"));
const CalendarWidgetEvent = defineAsyncComponent(
  () => import("./CalendarWidgetEvent.vue")
);

const selectedEvent = ref({} as FullCalendarEvent);
const selectedElement: Ref<HTMLElement | null> = ref(null);
const selectedOpen = ref(false);
const active = ref(false);
const errmsg = ref("");
const openInfo = (info: EventClickArg): void => {
  const open = (): void => {
    selectedEvent.value = {
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      extendedProps: info.event.extendedProps,
      allDay: info.event.allDay
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
    const { getGoogleCalendarEvents } = await import(
      "@/plugins/calendarService"
    );
    errmsg.value = "";
    active.value = true;
    const events = await getGoogleCalendarEvents();
    active.value = false;
    return events;
  } catch (error) {
    errmsg.value = error as string;
    active.value = false;
    return [];
  }
};
const calendarOptions = ref({
  plugins: [dayGridPlugin, listPlugin, timeGridPlugin],
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
      click: () => {
        window.open("YOUR_CALENDAR_URL", "_blank");
      }
    },
    downloadFile: {
      text: "Download .ics",
      click: () => {
        window.open("YOUR_CALENDAR_ICAL_FILE_URL", "_blank");
      }
    },
    refresh: {
      icon: "v-icon v-icon mdi mdi-refresh",
      click: getEvents
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
  eventClick: openInfo
});
const settings = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.siteSettings;
});

onMounted(async () => {
  calendarOptions.value.events = await getEvents();
});
</script>

<style lang="scss">
.fc *:before,
.fc *:after {
  vertical-align: bottom;
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
