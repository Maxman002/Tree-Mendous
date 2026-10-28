// Bird photos for the birdhouses slot: looked up once per species (by Latin name) in Wikipedia's
// free summary API, which returns a Wikimedia Commons thumbnail. Without internet or a photo the
// circle shows the first letters of the name instead.
const cache = new Map();   // latin name -> Promise<{ src, page } | null>
const known = new Map();   // latin name -> { src, page } once loaded, for instant redraws

export function photoFor(latin) {
  if (!latin) return Promise.resolve(null);
  if (!cache.has(latin)) {
    const title = encodeURIComponent(latin.replaceAll(" ", "_"));
    cache.set(latin, fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((page) => {
        if (!page?.thumbnail) return null;
        const photo = { src: page.thumbnail.source, page: page.content_urls?.desktop?.page ?? "" };
        known.set(latin, photo);
        return photo;
      })
      .catch(() => null));
  }
  return cache.get(latin);
}

// A round photo inside a ring in the species' colour. `label` is shown until the photo has loaded.
export function birdAvatar({ latin = "", color, label, size = 44 }, escapeHtml) {
  const photo = known.get(latin);
  const style = photo ? ` style="background-image:url('${escapeHtml(photo.src)}')"` : "";
  return `<span class="bird-avatar" style="--ring:${escapeHtml(color)};--size:${size}px">`
    + `<span class="bird-avatar-pic${photo ? " has-photo" : ""}" data-photo="${escapeHtml(latin)}"${style}>${escapeHtml(label)}</span></span>`;
}

// Fills every avatar inside `root` whose photo was not known yet when it was drawn.
export function loadPhotos(root) {
  root?.querySelectorAll(".bird-avatar-pic[data-photo]:not(.has-photo)").forEach((pic) => {
    photoFor(pic.dataset.photo).then((photo) => {
      if (!photo) return;
      const image = new Image();
      image.onload = () => {
        pic.style.backgroundImage = `url("${photo.src}")`;
        pic.classList.add("has-photo");
      };
      image.src = photo.src;
    });
  });
}

export const photoPage = (latin) => known.get(latin)?.page ?? "";
