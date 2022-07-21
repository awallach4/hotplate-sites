<template>
  <v-select
    v-model="selected"
    multiple
    filled
    :rules="rules"
    :items="items"
    :label="label"
    :disabled="disabled"
    color="secondary"
    item-color="secondary"
    item-text="text"
    item-value="value"
  >
    <template #prepend-item>
      <v-list-item ripple @click="toggle">
        <v-list-item-action>
          <v-icon :color="selected.length > 0 ? 'secondary' : ''">{{
            icon
          }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Select All</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="extraOption" ripple @click="addItem">
        <v-list-item-action>
          <v-icon :color="hasItem ? 'secondary' : ''">{{
            hasItem ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline"
          }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>{{ extraOptionLabel }}</v-list-item-content>
      </v-list-item>
      <v-divider class="mt-2" />
    </template>
    <template #selection="{ item, index }">
      <v-chip v-if="index <= 5">
        <span>{{ item.text }}</span>
      </v-chip>
      <span v-if="index === 5" class="grey--text caption"
        >(+{{ selected.length - 5 }} others)</span
      >
    </template>
  </v-select>
</template>

<script lang="ts" setup>
import { CheckboxIcons, type VSelectValues } from "@/types";
import { computed } from "vue";

interface Props {
  items: VSelectValues[];
  label: string;
  extraOption: string | null;
  extraOptionLabel: string;
  modelValue: string[];
  rules: unknown[];
  disabled: boolean;
}

interface Emits {
  (e: "update:modelValue", payload: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => {
    return [];
  },
  label: "",
  extraOption: null,
  extraOptionLabel: "",
  modelValue: () => {
    return [];
  },
  rules: () => {
    return [];
  },
  disabled: false
});

const emit = defineEmits<Emits>();

const selected = computed({
  get: () => {
    return props.modelValue;
  },
  set: (newValue) => {
    emit("update:modelValue", newValue);
  }
});

const icon = computed(() => {
  if (selected.value.length === props.items.length) {
    return CheckboxIcons.CHECKED;
  } else if (
    selected.value.length > 0 &&
    selected.value.length !== props.items.length
  ) {
    return CheckboxIcons.INDETERMINATE;
  } else {
    return CheckboxIcons.UNCHECKED;
  }
});

const hasItem = computed(() => {
  if (props.extraOption !== null) {
    return selected.value.includes(props.extraOption);
  } else {
    return false;
  }
});

const toggle = () => {
  if (selected.value.length >= props.items.length) {
    selected.value = [];
  } else if (selected.value.length < props.items.length) {
    if (props.items.length > 0) {
      const allItems: string[] = [];
      props.items.forEach((item) => {
        allItems.push(item.value);
      });
      selected.value = allItems;
    }
  }
};

const addItem = () => {
  if (props.extraOption) {
    if (hasItem.value) {
      const index = selected.value.indexOf(props.extraOption);
      selected.value.splice(index, 1);
    } else {
      selected.value.push(props.extraOption);
    }
  }
};
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
