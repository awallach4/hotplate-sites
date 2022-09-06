<template>
  <v-card :flat="!isElevated" :color="cardColor">
    <v-card-title v-if="header" :class="textColor">{{ header }}</v-card-title>
    <v-card-text :class="textColor">
      <slot />
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { VThemeColors } from "@/types";
import { computed } from "vue";

interface Props {
  isElevated: boolean;
  header?: string;
}
const props = withDefaults(defineProps<Props>(), {
  isElevated: true,
  header: ""
});
const cardColor = computed(() => {
  if (props.isElevated) {
    return VThemeColors.CARD;
  } else {
    return VThemeColors.BACKGROUND;
  }
});
const textColor = computed(() => {
  if (props.isElevated) {
    return `${VThemeColors.CARD_TEXT}--text`;
  } else {
    return `${VThemeColors.BACKGROUND_TEXT}--text`;
  }
});
</script>
