<template>
  <v-card
    class="editor rounded"
    :style="
      disabled ? { 'border-style': 'dashed' } : { 'border-style': 'solid' }
    "
    outlined
  >
    <div
      v-if="editor"
      class="menu"
      :style="
        $vuetify.theme.dark
          ? { backgroundColor: 'var(--v-card-lighten1)' }
          : { backgroundColor: 'var(--v-card-darken1)' }
      "
    >
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Undo"
            icon
            small
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().undo().run()"
          >
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </template>
        Undo
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Redo"
            icon
            small
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().redo().run()"
          >
            <v-icon>mdi-redo</v-icon>
          </v-btn>
        </template>
        Redo
      </v-tooltip>
      <v-menu offset-y max-height="200">
        <template #activator="{ on: menu, attrs }">
          <v-tooltip bottom>
            <template #activator="{ on: tooltip }">
              <v-btn
                v-bind="attrs"
                text
                small
                class="px-1"
                aria-label="Heading Level"
                :disabled="disabled"
                v-on="{ ...tooltip, ...menu }"
              >
                {{ textTypes[currentStyle] }} <v-icon>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            Heading Level
          </v-tooltip>
        </template>
        <v-list>
          <v-list-item-group v-model="currentStyle" color="secondary" mandatory>
            <v-list-item v-for="(level, index) in textTypes" :key="index">
              <v-list-item-title>{{ level }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
      <v-menu offset-y max-height="200">
        <template #activator="{ on: menu, attrs }">
          <v-tooltip bottom>
            <template #activator="{ on: tooltip }">
              <v-btn
                v-bind="attrs"
                text
                small
                class="px-1"
                aria-label="Font"
                :disabled="disabled"
                v-on="{ ...menu, ...tooltip }"
              >
                {{
                  fontTypes[currentFont].slice(
                    0,
                    fontTypes[currentFont].indexOf(",")
                  )
                }}
                <v-icon>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            Font
          </v-tooltip>
        </template>
        <v-list>
          <v-list-item-group v-model="currentFont" color="secondary" mandatory>
            <v-list-item v-for="(item, index) in fontTypes" :key="index">
              <v-list-item-title :style="{ fontFamily: item }">{{
                item.slice(0, item.indexOf(","))
              }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Bold"
            icon
            small
            :class="{ 'is-active': editor.isActive('bold') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <v-icon>mdi-format-bold</v-icon>
          </v-btn>
        </template>
        Bold
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Italic"
            icon
            small
            :class="{ 'is-active': editor.isActive('italic') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <v-icon>mdi-format-italic</v-icon>
          </v-btn>
        </template>
        Italic
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Underline"
            icon
            small
            :class="{ 'is-active': editor.isActive('underline') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleUnderline().run()"
          >
            <v-icon>mdi-format-underline</v-icon>
          </v-btn>
        </template>
        Underline
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Strikethrough"
            icon
            small
            :class="{ 'is-active': editor.isActive('strike') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleStrike().run()"
          >
            <v-icon>mdi-format-strikethrough</v-icon>
          </v-btn>
        </template>
        Strikethrough
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Blockquote"
            icon
            small
            :class="{ 'is-active': editor.isActive('blockquote') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleBlockquote().run()"
          >
            <v-icon>mdi-format-quote-close</v-icon>
          </v-btn>
        </template>
        Blockquote
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Code"
            icon
            small
            :class="{ 'is-active': editor.isActive('code') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleCode().run()"
          >
            <v-icon>mdi-code-tags</v-icon>
          </v-btn>
        </template>
        Code
      </v-tooltip>
      <v-menu offset-y max-height="200">
        <template #activator="{ on: menu, attrs }">
          <v-tooltip bottom>
            <template #activator="{ on: tooltip }">
              <v-btn
                v-bind="attrs"
                :color="colorTypes[currentColor].value"
                :class="{ 'is-active': editor.isActive('highlight') }"
                icon
                small
                aria-label="Highlight color"
                :disabled="disabled"
                v-on="{ ...menu, ...tooltip }"
              >
                <v-icon small>mdi-marker</v-icon>
              </v-btn>
            </template>
            Highlight color
          </v-tooltip>
        </template>
        <v-list>
          <v-list-item-group v-model="currentColor" color="secondary" mandatory>
            <v-list-item v-for="(item, index) in colorTypes" :key="index">
              <v-list-item-title>{{ item.text }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
      <v-dialog v-model="addLink" max-width="350px">
        <v-card>
          <v-card-title>Add Link</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="linkURL"
              label="URL"
              filled
              color="secondary"
              append-icon="mdi-close"
              @click:append="linkURL = ''"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" class="sectext--text" @click="insertLink()"
              >Save</v-btn
            >
            <v-btn color="error" class="errtext--text" @click="addLink = false"
              >Cancel</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Link"
            icon
            small
            :class="{ 'is-active': editor.isActive('link') }"
            :disabled="disabled"
            v-on="on"
            @click.stop="addLink = true"
          >
            <v-icon>mdi-link</v-icon>
          </v-btn>
        </template>
        Add Link
      </v-tooltip>
      <v-dialog v-if="useImg" v-model="addImage" max-width="300px">
        <v-card>
          <v-card-title>Add Image</v-card-title>
          <v-card-text>
            <v-form id="imgForm" ref="imgForm" @submit.prevent="insertImage()">
              <v-text-field
                v-model="imgUrl"
                label="Image URL"
                filled
                :rules="[fieldRequired]"
                color="secondary"
              />
              <v-text-field
                v-model="altTxt"
                label="Alternate Text"
                filled
                color="secondary"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn
              type="submit"
              color="secondary"
              class="sectext--text"
              form="imgForm"
              >Add Image</v-btn
            >
            <v-btn color="error" class="errtext--text" @click="addImage = false"
              >Cancel</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-tooltip v-if="useImg" bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Add Image"
            icon
            small
            :disabled="disabled"
            v-on="on"
            @click.stop="addImage = true"
          >
            <v-icon>mdi-image</v-icon>
          </v-btn>
        </template>
        Add Image
      </v-tooltip>
      <v-menu offset-y max-height="200">
        <template #activator="{ on: menu, attrs }">
          <v-tooltip bottom>
            <template #activator="{ on: tooltip }">
              <v-btn
                v-bind="attrs"
                text
                small
                class="px-1"
                aria-label="Text Align"
                :disabled="disabled"
                v-on="{ ...menu, ...tooltip }"
              >
                <v-icon>{{
                  `mdi-format-align-${alignTypes[currentAlign].toLowerCase()}`
                }}</v-icon>
                <v-icon>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            Align
          </v-tooltip>
        </template>
        <v-list>
          <v-list-item-group v-model="currentAlign" color="secondary" mandatory>
            <v-list-item v-for="(item, index) in alignTypes" :key="index">
              <v-list-item-title>{{ item }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Numbered List"
            icon
            small
            :class="{ 'is-active': editor.isActive('orderedList') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <v-icon>mdi-format-list-numbered</v-icon>
          </v-btn>
        </template>
        Numbered List
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Bullet List"
            icon
            small
            :class="{ 'is-active': editor.isActive('bulletList') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-btn>
        </template>
        Bulleted List
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Horizontal Line"
            icon
            small
            :class="{ 'is-active': editor.isActive('horizontalRule') }"
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().setHorizontalRule().run()"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </template>
        Horizontal Line
      </v-tooltip>
      <v-dialog v-model="addTable" max-width="300px">
        <v-card>
          <v-card-title>Add Table</v-card-title>
          <v-card-text>
            <v-form
              id="tableForm"
              ref="tableForm"
              @submit.prevent="insertTable()"
            >
              <v-text-field
                v-model.number="trows"
                label="Number of Rows"
                type="number"
                min="1"
                :rules="[minValue(trows, 1, 'Table must have at least 1 row.')]"
                filled
                color="secondary"
              />
              <v-text-field
                v-model.number="tcols"
                label="Number of Columns"
                type="number"
                min="1"
                :rules="[
                  minValue(tcols, 1, 'Table must have at least 1 column.')
                ]"
                filled
                color="secondary"
              />
              <v-checkbox
                v-model="theader"
                label="Table Header"
                color="secondary"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn
              type="submit"
              color="secondary"
              class="sectext--text"
              form="tableForm"
              >Create Table</v-btn
            >
            <v-btn color="error" class="errtext--text" @click="addTable = false"
              >Cancel</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Add Table"
            :class="{ 'is-active': editor.isActive('table') }"
            :disabled="disabled"
            icon
            small
            v-on="on"
            @click.stop="addTable = true"
          >
            <v-icon>mdi-table</v-icon>
          </v-btn>
        </template>
        Add Table
      </v-tooltip>
      <template v-if="editor.isActive('table')">
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Delete Table"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().deleteTable().run()"
            >
              <v-icon>mdi-table-off</v-icon>
            </v-btn>
          </template>
          Delete Table
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Add Column Left"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().addColumnBefore().run()"
            >
              <v-icon>mdi-table-column-plus-before</v-icon>
            </v-btn>
          </template>
          Add Column Left
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Add Column Right"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().addColumnAfter().run()"
            >
              <v-icon>mdi-table-column-plus-after</v-icon>
            </v-btn>
          </template>
          Add Column Right
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Delete Column"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().deleteColumn().run()"
            >
              <v-icon>mdi-table-column-remove</v-icon>
            </v-btn>
          </template>
          Delete Column
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Add Row Above"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().addRowBefore().run()"
            >
              <v-icon>mdi-table-row-plus-before</v-icon>
            </v-btn>
          </template>
          Add Row Above
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Add Row Below"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().addRowAfter().run()"
            >
              <v-icon>mdi-table-row-plus-after</v-icon>
            </v-btn>
          </template>
          Add Row Below
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Delete Row"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().deleteRow().run()"
            >
              <v-icon>mdi-table-row-remove</v-icon>
            </v-btn>
          </template>
          Delete Row
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Toggle Cell Merge"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().mergeOrSplit().run()"
            >
              <v-icon>mdi-table-merge-cells</v-icon>
            </v-btn>
          </template>
          Toggle Cell Merge
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Toggle Header Cell"
              icon
              small
              :disabled="disabled"
              v-on="on"
              @click="editor.chain().focus().toggleHeaderCell().run()"
            >
              <v-icon>mdi-table-headers-eye</v-icon>
            </v-btn>
          </template>
          Toggle Header Cell
        </v-tooltip>
      </template>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            aria-label="Clear Formatting"
            icon
            small
            :disabled="disabled"
            v-on="on"
            @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
          >
            <v-icon>mdi-format-clear</v-icon>
          </v-btn>
        </template>
        Clear Formatting
      </v-tooltip>
    </div>
    <editor-content class="editor-content" :editor="editor" />
  </v-card>
</template>

<script lang="ts" setup>
import { Editor, EditorContent } from "@tiptap/vue-2";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import type { VFormOptions } from "@/types";
import { fieldRequired, minValue } from "@/plugins/formRules";
import { computed, onBeforeUnmount, ref, watch } from "@vue/composition-api";

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  useImg?: boolean;
}
interface Emits {
  (e: "update:modelValue", value: string): void;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "",
  disabled: false,
  useImg: true
});
const emit = defineEmits<Emits>();
const textTypes = [
  "Normal Text",
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Heading 4",
  "Heading 5",
  "Heading 6"
];
const fontTypes = [
  "Arial, Helvetica, sans-serif",
  "Arial Black, Arial, Helvetica, sans-serif",
  "Comic Sans MS, Comic Sans, cursive",
  "Courier New, Courier, monospace",
  "Georgia, serif",
  "Impact, fantasy",
  "Roboto, Arial, sans-serif",
  "Tahoma, Verdana, sans-serif",
  "Times New Roman, Times, serif",
  "Trebuchet MS, Helvetica, sans-serif",
  "Verdana, sans-serif"
];
const alignTypes = ["Left", "Center", "Right", "Justify"];
const colorTypes = [
  { text: "Transparent", value: "" },
  { text: "White", value: "#ffffff" },
  { text: "Red", value: "#ef5350" },
  { text: "Green", value: "#66bb6a" },
  { text: "Blue", value: "#42a5f5" },
  { text: "Yellow", value: "#ffee58" },
  { text: "Magenta", value: "#ab47bc" },
  { text: "Cyan", value: "#26c6da" }
];
const editor = ref(
  new Editor({
    content: props.modelValue,
    extensions: [
      StarterKit,
      Underline,
      Link,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "tiptap"
        }
      }),
      TableCell,
      TableHeader,
      TableRow,
      Image,
      Placeholder.configure({
        placeholder: props.placeholder
      }),
      TextStyle,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
      })
    ],
    editable: !props.disabled,
    onUpdate: () => {
      emit("update:modelValue", editor.value.getHTML());
    },
    onCreate: () => {
      editor.value.chain().setFontFamily(fontTypes[6]).run();
    }
  })
);
watch(
  () => props.modelValue,
  (newValue) => {
    const isSame = editor.value.getHTML() === newValue;
    if (!isSame) {
      editor.value.commands.setContent(newValue, false);
    }
  }
);
watch(
  () => props.disabled,
  (newValue) => {
    editor.value.setEditable(!newValue);
  }
);
const addLink = ref(false);
const linkURL = ref("");
const addTable = ref(false);
const trows = ref(3);
const tcols = ref(3);
const theader = ref(false);
const addImage = ref(false);
const imgUrl = ref("");
const altTxt = ref("");
const tableForm = ref({} as VFormOptions);
const imgForm = ref({} as VFormOptions);
const currentStyle = computed({
  get: () => {
    const isH1 = editor.value.isActive("heading", { level: 1 });
    const isH2 = editor.value.isActive("heading", { level: 2 });
    const isH3 = editor.value.isActive("heading", { level: 3 });
    const isH4 = editor.value.isActive("heading", { level: 4 });
    const isH5 = editor.value.isActive("heading", { level: 5 });
    const isH6 = editor.value.isActive("heading", { level: 6 });
    if (isH1) {
      return 1;
    } else if (isH2) {
      return 2;
    } else if (isH3) {
      return 3;
    } else if (isH4) {
      return 4;
    } else if (isH5) {
      return 5;
    } else if (isH6) {
      return 6;
    } else {
      return 0;
    }
  },
  set: (level) => {
    if (level !== 0) {
      editor.value.chain().focus().setHeading({ level }).run();
    } else {
      editor.value.chain().focus().setParagraph().run();
    }
  }
});
const currentFont = computed({
  get: () => {
    const isArial = editor.value.isActive("textStyle", {
      fontFamily: "Arial, Helvetica, sans-serif"
    });
    const isArialBlack = editor.value.isActive("textStyle", {
      fontFamily: "Arial Black, Arial, Helvetica, sans-serif"
    });
    const isComicSans = editor.value.isActive("textStyle", {
      fontFamily: "Comic Sans MS, Comic Sans, cursive"
    });
    const isCourierNew = editor.value.isActive("textStyle", {
      fontFamily: "Courier New, Courier, monospace"
    });
    const isGeorgia = editor.value.isActive("textStyle", {
      fontFamily: "Georgia, serif"
    });
    const isImpact = editor.value.isActive("textStyle", {
      fontFamily: "Impact, fantasy"
    });
    const isRoboto = editor.value.isActive("textStyle", {
      fontFamily: "Roboto, Arial, sans-serif"
    });
    const isTahoma = editor.value.isActive("textStyle", {
      fontFamily: "Tahoma, Verdana, sans-serif"
    });
    const isTimesNewRoman = editor.value.isActive("textStyle", {
      fontFamily: "Times New Roman, Times, serif"
    });
    const isTrebuchet = editor.value.isActive("textStyle", {
      fontFamily: "Trebuchet MS, Helvetica, sans-serif"
    });
    const isVerdana = editor.value.isActive("textStyle", {
      fontFamily: "Verdana, sans-serif"
    });
    if (isArial) {
      return 0;
    } else if (isArialBlack) {
      return 1;
    } else if (isComicSans) {
      return 2;
    } else if (isCourierNew) {
      return 3;
    } else if (isGeorgia) {
      return 4;
    } else if (isImpact) {
      return 5;
    } else if (isRoboto) {
      return 6;
    } else if (isTahoma) {
      return 7;
    } else if (isTimesNewRoman) {
      return 8;
    } else if (isTrebuchet) {
      return 9;
    } else if (isVerdana) {
      return 10;
    } else {
      return 6;
    }
  },
  set: (font) => {
    editor.value.chain().focus().setFontFamily(fontTypes[font]).run();
  }
});
const currentColor = computed({
  get: () => {
    const isWhite = editor.value.isActive("highlight", { color: "#ffffff" });
    const isRed = editor.value.isActive("highlight", { color: "#ef5350" });
    const isGreen = editor.value.isActive("highlight", { color: "#66bb6a" });
    const isBlue = editor.value.isActive("highlight", { color: "#42a5f5" });
    const isYellow = editor.value.isActive("highlight", { color: "#ffee58" });
    const isMagenta = editor.value.isActive("highlight", { color: "#ab47bc" });
    const isCyan = editor.value.isActive("highlight", { color: "#26c6da" });
    const isDefault = editor.value.isActive("highlight");
    if (isWhite) {
      return 1;
    } else if (isRed) {
      return 2;
    } else if (isGreen) {
      return 3;
    } else if (isBlue) {
      return 4;
    } else if (isYellow) {
      return 5;
    } else if (isMagenta) {
      return 6;
    } else if (isCyan) {
      return 7;
    } else if (isDefault) {
      return 5;
    } else {
      return 0;
    }
  },
  set: (color) => {
    if (colorTypes[color].value) {
      editor.value
        .chain()
        .focus()
        .setHighlight({ color: colorTypes[color].value })
        .run();
    } else {
      editor.value.chain().focus().unsetHighlight().run();
    }
  }
});
const currentAlign = computed({
  get: () => {
    const isLeft = editor.value.isActive({ textAlign: "left" });
    const isCenter = editor.value.isActive({ textAlign: "center" });
    const isRight = editor.value.isActive({ textAlign: "right" });
    const isJustify = editor.value.isActive({ textAlign: "justify" });
    if (isLeft) {
      return 0;
    } else if (isCenter) {
      return 1;
    } else if (isRight) {
      return 2;
    } else if (isJustify) {
      return 3;
    } else {
      return 0;
    }
  },
  set: (align) => {
    editor.value
      .chain()
      .focus()
      .setTextAlign(alignTypes[align].toLowerCase())
      .run();
  }
});
watch(addLink, () => {
  if (!addLink.value) {
    linkURL.value = "";
  }
});
watch(addTable, () => {
  if (!addTable.value) {
    trows.value = 3;
    tcols.value = 3;
    theader.value = false;
    tableForm.value.resetValidation();
  }
});
watch(addImage, () => {
  if (!addImage.value) {
    imgUrl.value = "";
    altTxt.value = "";
    imgForm.value.resetValidation();
  }
});
onBeforeUnmount(() => {
  editor.value.destroy();
});
const insertLink = () => {
  editor.value.chain().focus().setLink({ href: linkURL.value }).run();
  addLink.value = false;
};
const insertTable = () => {
  const isValid = tableForm.value.validate();
  if (!isValid) {
    return;
  }
  editor.value
    .chain()
    .focus()
    .insertTable({
      rows: trows.value,
      cols: tcols.value,
      withHeaderRow: theader.value
    })
    .run();
  addTable.value = false;
};
const insertImage = () => {
  const isValid = imgForm.value.validate();
  if (!isValid) {
    return;
  }
  editor.value
    .chain()
    .focus()
    .setImage({ src: imgUrl.value, alt: altTxt.value })
    .run();
  addImage.value = false;
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

<style lang="scss">
.editor {
  .editor-content {
    padding: 5px;
  }
  .menu {
    padding: 3px;
  }
  .ProseMirror-focused {
    outline: none;
  }

  .ProseMirror {
    margin: 10px;
    min-height: 25vh;
    max-height: 50vh;
    overflow-y: auto;

    table {
      border-collapse: collapse;
      table-layout: fixed;
      overflow: hidden;
      width: 100%;
      margin: 0;
    }

    td,
    th {
      border: solid 2px var(--v-cardtext-base);
      padding: 3px 5px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;
      min-width: 1em;

      > * {
        margin-bottom: 0 !important;
      }
    }

    th {
      font-weight: bold;
      text-align: left;
    }

    .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: rgba(51, 144, 255, 0.4);
      pointer-events: none;
    }
  }

  .is-active:not(.theme--dark) {
    background-color: var(--v-card-darken2);
  }

  .is-active.theme--dark {
    background-color: var(--v-card-lighten2);
  }

  .resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
  }

  .tableWrapper {
    padding: 1rem 0;
    overflow-x: auto;
    max-width: 100%;
  }

  .theme--light th {
    background-color: var(--v-card-darken1);
  }

  .v-btn {
    margin: 2px 6px;
  }

  img {
    max-width: 300px;
    max-height: 300px;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    pointer-events: none;
    height: 0;
  }
}

.theme--light .ProseMirror p.is-editor-empty:first-child::before {
  color: rgb(0, 0, 0, 0.6);
}

.theme--dark .ProseMirror p.is-editor-empty:first-child::before {
  color: rgb(255, 255, 255, 0.7);
}
</style>
