<template>
  <v-snackbar v-model="isVisible">
    {{ message }}
    <template #action="{ attrs }">
      <v-btn v-bind="attrs" text color="pink" @click="isVisible = false">
        Dismiss
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { computed } from "vue";
interface Props {
  message: string | Error;
  modelValue: boolean;
}
interface Emits {
  (e: "update:modelValue", state: boolean): void;
}
const props = withDefaults(defineProps<Props>(), {
  message: "",
  modelValue: false
});
const emit = defineEmits<Emits>();
const isVisible = computed({
  get: () => {
    return props.modelValue;
  },
  set: (newValue) => {
    emit("update:modelValue", newValue);
  }
});
</script>

<script lang="ts">
// TODO: Remove after Vue 3 upgrade.
export default {
  model: {
    prop: "modelValue",
    event: "update:modelValue"
  }
};
</script>
