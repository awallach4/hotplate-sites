<template>
  <v-card
    min-width="300px"
    width="90vw"
    max-width="400px"
    flat
    class="rounded overflow-auto"
    color="card"
    max-height="70vh"
  >
    <v-toolbar color="primary" class="pritext--text" flat>
      <v-toolbar-title>{{ event.title }}</v-toolbar-title>
      <v-spacer
        v-if="
          event.extendedProps &&
          event.extendedProps.creator &&
          event.extendedProps.creator.email !==
            'en.usa#holiday@group.v.calendar.google.com'
        "
      />
      <v-btn
        v-if="
          event.extendedProps &&
          event.extendedProps.creator &&
          event.extendedProps.creator.email !==
            'en.usa#holiday@group.v.calendar.google.com'
        "
        class="pritext--text"
        icon
        :disabled="fetchingEvents"
        aria-label="Edit Event"
        @click="emit('edit')"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <v-btn
        v-if="
          event.extendedProps &&
          event.extendedProps.creator &&
          event.extendedProps.creator.email !==
            'en.usa#holiday@group.v.calendar.google.com'
        "
        class="pritext--text"
        icon
        :disabled="fetchingEvents"
        aria-label="Delete Event"
        @click="emit('delete')"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text v-if="event.start" class="cardtext--text">
      <strong>When: {{ dates }}</strong>
      <v-spacer />
      <strong v-if="location"
        >Where:
        <a
          :href="location.link"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          {{ location.text }}
        </a>
      </strong>
      <v-spacer />
      <span
        v-if="event.extendedProps && event.extendedProps.description"
        v-html="
          sanitized(`<span>Details: ${event.extendedProps.description}</span>`)
        "
      />
    </v-card-text>
    <v-card-actions>
      <v-btn text @click="emit('close')">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import type { FullCalendarEvent } from "@/types";
import { formatRange } from "@fullcalendar/vue";
import { computed } from "vue";
import sanitized from "@/plugins/dompurify";

interface Props {
  event: FullCalendarEvent;
  fetchingEvents: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  event: () => {
    return {} as FullCalendarEvent;
  },
  fetchingEvents: false
});

const emit = defineEmits<Emits>();

const dates = computed(() => {
  if (props.event.allDay) {
    return formatRange(props.event.start, new Date(props.event.end), {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  } else {
    return formatRange(props.event.start, props.event.end, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "numeric",
      minute: "2-digit"
    });
  }
});

const location = computed(() => {
  const event = props.event.extendedProps;
  if (event && event.location) {
    if (
      event.location.startsWith("https://") ||
      event.location.startsWith("http://")
    ) {
      return {
        link: event.location,
        text: event.location
      };
    } else {
      return {
        link: `https://maps.google.com/maps/search/${encodeURI(
          event.location
        )}`,
        text: event.location
      };
    }
  } else {
    return null;
  }
});
</script>
