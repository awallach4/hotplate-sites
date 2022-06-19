<template>
  <v-alert :type="type" class="alert-message" :class="`${textColor}--text`">
    <template #prepend>
      <v-icon class="mr-3" :color="textColor">{{ icon }}</v-icon>
    </template>
    {{ text }}
  </v-alert>
</template>

<script lang="ts" setup>
import { AlertMessageTypes, VAlertIconTypes, VThemeColors } from "@/types";
import { computed } from "@vue/composition-api";

interface Props {
  text?: string;
  type?: AlertMessageTypes;
}
const props = withDefaults(defineProps<Props>(), {
  text: "",
  type: AlertMessageTypes.INFORMATION
});
const icon = computed(() => {
  if (props.type === AlertMessageTypes.INFORMATION) {
    return VAlertIconTypes.INFORMATION;
  } else if (props.type === AlertMessageTypes.ERROR) {
    return VAlertIconTypes.ERROR;
  } else if (props.type === AlertMessageTypes.WARNING) {
    return VAlertIconTypes.WARNING;
  } else if (props.type === AlertMessageTypes.SUCCESS) {
    return VAlertIconTypes.SUCCESS;
  } else {
    return VAlertIconTypes.INFORMATION;
  }
});
const textColor = computed(() => {
  if (props.type === AlertMessageTypes.INFORMATION) {
    return VThemeColors.INFO_TEXT;
  } else if (props.type === AlertMessageTypes.ERROR) {
    return VThemeColors.ERROR_TEXT;
  } else if (props.type === AlertMessageTypes.WARNING) {
    return VThemeColors.WARNING_TEXT;
  } else if (props.type === AlertMessageTypes.SUCCESS) {
    return VThemeColors.SUCCESS_TEXT;
  } else {
    return VThemeColors.INFO_TEXT;
  }
});
</script>
