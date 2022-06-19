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
import { formatRange } from "@fullcalendar/vue";
import type { FullCalendarEvent } from "@/types";
import sanitized from "@/plugins/dompurify";
import { computed } from "@vue/composition-api";

interface Props {
  event: FullCalendarEvent;
}

interface Emits {
  (e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
  event: () => {
    return {} as FullCalendarEvent;
  }
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
