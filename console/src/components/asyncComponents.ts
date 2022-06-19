import { defineAsyncComponent } from "@vue/composition-api";

export const VPageAlert = defineAsyncComponent(
  () => import("@/components/ui/VPageAlert.vue")
);

export const VProfilePhoto = defineAsyncComponent(
  () => import("@/components/ui/VProfilePhoto.vue")
);

export const TiptapEditor = defineAsyncComponent(
  () => import("@/components/ui/TiptapEditor.vue")
);

export const AlertMessage = defineAsyncComponent(
  () => import("@/components/system/AlertMessage.vue")
);

export const CalendarWidget = defineAsyncComponent(
  () => import("@/components/system/CalendarWidget.vue")
);

export const ColumnLayout = defineAsyncComponent(
  () => import("@/components/system/ColumnLayout.vue")
);

export const ContactForm = defineAsyncComponent(
  () => import("@/components/system/ContactForm.vue")
);

export const DocumentList = defineAsyncComponent(
  () => import("@/components/system/DocumentList.vue")
);

export const ImageCarousel = defineAsyncComponent(
  () => import("@/components/system/ImageCarousel.vue")
);

export const ItemList = defineAsyncComponent(
  () => import("@/components/system/ItemList.vue")
);

export const MessageStream = defineAsyncComponent(
  () => import("@/components/system/MessageStream.vue")
);

export const MessageStreamComment = defineAsyncComponent(
  () => import("@/components/system/MessageStreamComment.vue")
);

export const MessageStreamCreator = defineAsyncComponent(
  () => import("@/components/system/MessageStreamCreator.vue")
);

export const MessageStreamPost = defineAsyncComponent(
  () => import("@/components/system/MessageStreamPost.vue")
);

export const PageHeader = defineAsyncComponent(
  () => import("@/components/system/PageHeader.vue")
);

export const PlainText = defineAsyncComponent(
  () => import("@/components/system/PlainText.vue")
);

export const RequestForm = defineAsyncComponent(
  () => import("@/components/system/RequestForm.vue")
);

export const RichText = defineAsyncComponent(
  () => import("@/components/system/RichText.vue")
);

export const SignupSheet = defineAsyncComponent(
  () => import("@/components/system/SignupSheet.vue")
);

export const SignupSheetCollection = defineAsyncComponent(
  () => import("@/components/system/SignupSheetCollection.vue")
);

export const VideoEmbed = defineAsyncComponent(
  () => import("@/components/system/VideoEmbed.vue")
);

export const NonexistentComponent = defineAsyncComponent(
  () => import("@/components/system/NonexistentComponent.vue")
);
