<template>
  <card-wrap :is-elevated="useCard" :header="header" class="rich-text">
    <span v-html="sanitized(text)" />
  </card-wrap>
</template>

<script lang="ts" setup>
import sanitized from "@/plugins/dompurify";

interface Props {
  header?: string;
  text?: string;
  useCard?: boolean;
}
withDefaults(defineProps<Props>(), {
  header: "",
  text: "",
  useCard: true
});
</script>

<style lang="scss">
.rich-text {
  img {
    max-width: 300px;
    max-height: 300px;
  }

  table {
    border-collapse: collapse;
  }

  td,
  th {
    border: solid 2px var(--v-cardtext-base);
    padding: 5px;
  }
}
</style>
