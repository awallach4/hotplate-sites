<template>
  <card-wrap :is-elevated="useCard" class="plain-text">
    {{ text }}
  </card-wrap>
</template>

<script lang="ts" setup>
interface Props {
  text?: string;
  useCard?: boolean;
}
withDefaults(defineProps<Props>(), {
  text: "",
  useCard: false
});
</script>
