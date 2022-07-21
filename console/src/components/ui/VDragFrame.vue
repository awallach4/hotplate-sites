<template>
  <div class="d-flex align-center ml-n6">
    <v-icon class="handle">mdi-drag-vertical</v-icon>
    <v-card
      :outlined="notCard"
      class="flex-grow-1 overflow-hidden"
      :style="{ backgroundColor: color }"
    >
      <v-card-title :class="textColor" class="flex-nowrap">
        {{ header }}
        <v-tooltip v-if="!error" bottom>
          <template #activator="{ on }">
            <v-btn
              :aria-label="`${hidden ? 'Show' : 'Hide'} ${name}`"
              icon
              class="ml-auto"
              :class="textColor"
              v-on="on"
              @click="emit('hide', !hidden)"
            >
              <v-icon v-if="hidden">mdi-eye-off</v-icon>
              <v-icon v-else>mdi-eye</v-icon>
            </v-btn>
          </template>
          {{ hidden ? "Show" : "Hide" }} {{ name }}
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              v-if="canDelete"
              :aria-label="`Delete ${name}`"
              icon
              :class="{ 'ml-auto': error, [`${textColor}`]: true }"
              v-on="on"
              @click="emit('delete')"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
          Delete {{ name }}
        </v-tooltip>
      </v-card-title>
      <slot />
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  canDelete: boolean;
  name: string;
  header: string;
  notCard: boolean;
  error?: boolean;
  hidden: boolean;
}

interface Emits {
  (e: "delete"): void;
  (e: "hide", payload: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  canDelete: true,
  name: "",
  header: "",
  notCard: false,
  error: false,
  hidden: false
});

const emit = defineEmits<Emits>();

const color = computed(() => {
  if (props.notCard) {
    return "var(--v-background-base)";
  } else if (props.error) {
    return "var(--v-error-base)";
  } else {
    return "var(--v-card-base)";
  }
});

const textColor = computed(() => {
  if (props.notCard) {
    return "bgtext-lighten2--text";
  } else if (props.error) {
    return "errtext--text";
  } else {
    return "cardtext-lighten2--text";
  }
});
</script>

<script lang="ts">
export default {
  model: {
    prop: "hidden",
    event: "hide"
  }
};
</script>
