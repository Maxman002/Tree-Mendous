// The "Tools" section of the sidebar. Every tool slot gets a card; its init(ctx) fills ctx.el.
export function createToolCard(container, slot, i18n) {
  const card = document.createElement("article");
  card.className = "tool-card";
  card.innerHTML = '<h3></h3><p class="tool-source"></p><div class="tool-body"></div>';
  container.append(card);

  let failed = false;
  function draw() {
    const heading = card.querySelector("h3");
    heading.replaceChildren(i18n.pick(slot.title));
    if (slot.status === "placeholder") {
      const badge = document.createElement("span");
      badge.className = "status-badge";
      badge.textContent = i18n.t("core.status.placeholder");
      heading.append(badge);
    }
    card.querySelector(".tool-source").textContent = failed ? i18n.t("core.layers.failed") : i18n.pick(slot.source);
  }
  i18n.onChange(draw);
  draw();

  return {
    body: card.querySelector(".tool-body"),
    fail() {
      failed = true;
      card.querySelector(".tool-body").replaceChildren();
      draw();
    }
  };
}
