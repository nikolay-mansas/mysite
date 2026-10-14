export function portal(
  node: HTMLElement,
  target: HTMLElement | string = "body",
) {
  if (typeof document === "undefined") return;

  const parent =
    typeof target === "string"
      ? (document.querySelector(target) as HTMLElement | null)
      : target;

  if (!parent) {
    console.warn(`[portal] target not found:`, target);
    return;
  }

  parent.appendChild(node);

  return {
    destroy() {
      node.remove();
    },
  };
}
