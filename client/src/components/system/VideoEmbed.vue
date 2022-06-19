<template>
  <card-wrap :is-elevated="useCard" :header="header" class="video-embed">
    <p v-html="sanitized(text)" />
    <video controls>
      <source :src="storPath" :type="type" />
      We're sorry, but it looks like your browser does not support videos.
    </video>
  </card-wrap>
</template>

<script lang="ts" setup>
import sanitized from "@/plugins/dompurify";

interface Props {
  header?: string;
  text?: string;
  storPath?: string;
  type?: string;
  useCard?: boolean;
}
withDefaults(defineProps<Props>(), {
  header: "",
  text: "",
  storPath: "",
  type: "",
  useCard: true
});
</script>

<style lang="scss" scoped>
video {
  max-width: 100%;
  outline: none;
}
</style>
