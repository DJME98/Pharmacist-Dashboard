// Replaces an element's children, skipping empty values such as null or false.
export function put(el, ...kids) {
  el.replaceChildren(...kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false));
}
