// A short message at the bottom of the screen, e.g. "A route can have at most 11 stops".
export function createToast(element) {
  let timer;
  return function notify(message) {
    element.textContent = message;
    element.classList.add("is-visible");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => element.classList.remove("is-visible"), 3600);
  };
}
