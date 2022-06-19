<template>
  <card-wrap :is-elevated="useCard" :header="header" class="image-carousel">
    <p>Click an image to open it in a new tab.</p>
    <v-carousel hide-delimiters height="300">
      <a
        v-for="image in storPath"
        :key="image"
        :href="image"
        rel="noopener noreferrer nofollow"
        target="_blank"
        aria-label="Carousel Item"
      >
        <v-carousel-item :src="image" contain alt="Carousel Item" />
      </a>
    </v-carousel>
  </card-wrap>
</template>

<script lang="ts" setup>
interface Props {
  header?: string;
  storPath?: string[];
  useCard?: boolean;
}
withDefaults(defineProps<Props>(), {
  header: "",
  storPath: () => [],
  useCard: true
});
</script>
