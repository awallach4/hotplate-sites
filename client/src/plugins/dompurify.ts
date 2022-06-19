import purify from "dompurify";

/**
 * Sanitizes a raw HTML string to remove any malicious content.
 * @function sanitized
 * @param { string } content - The raw HTML string to be sanitized.
 * @returns { string } The sanitized HTML string.
 */
export default function sanitized(content: string): string {
  purify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer noopener");
    }
  });
  return purify.sanitize(content, {
    ALLOWED_TAGS: [
      "b",
      "u",
      "strong",
      "i",
      "em",
      "li",
      "ul",
      "ol",
      "br",
      "wbr",
      "img",
      "picture",
      "source",
      "video",
      "audio",
      "mark",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "div",
      "span",
      "article",
      "section",
      "aside",
      "hr",
      "code",
      "blockquote",
      "q",
      "s",
      "ins",
      "del",
      "a",
      "nobr",
      "dd",
      "dl",
      "table",
      "tbody",
      "thead",
      "tfoot",
      "th",
      "tr",
      "td",
      "caption",
      "col",
      "colspan"
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "class",
      "id",
      "controls",
      "alt",
      "style",
      "data-color"
    ]
  });
}
