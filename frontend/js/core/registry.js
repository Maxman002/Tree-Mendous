// Checks the slots listed in features/index.js against the slot contract and runs their init().
// The core never imports a slot by name; it only sees the list it is given.
export const KINDS = ["base-layer", "overlay", "tool"];
export const STATUSES = ["placeholder", "ready"];

export function checkSlot(slot) {
  if (!slot || typeof slot !== "object") return ["the module must `export default` a slot object"];
  const problems = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slot.id ?? "")) problems.push("`id` must be kebab-case and match the folder name");
  if (!KINDS.includes(slot.kind)) problems.push(`\`kind\` must be one of ${KINDS.join(", ")}`);
  if (!slot.title?.en) problems.push("`title.en` is missing");
  if (!STATUSES.includes(slot.status)) problems.push(`\`status\` must be one of ${STATUSES.join(", ")}`);
  if (!slot.source) problems.push("`source` is missing (cite the data source)");
  if (typeof slot.init !== "function") problems.push("`init(ctx)` is missing");
  return problems;
}

function loadSlotStyle(slot) {
  if (!slot.style) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL(`../features/${slot.id}/${slot.style}`, import.meta.url).href;
  document.head.append(link);
}

// Returns one entry per valid slot, in list order: { slot, layer } or { slot, error }.
export async function initSlots(slots, createContext) {
  const seen = new Set();
  const valid = slots.filter((slot, index) => {
    const problems = checkSlot(slot);
    if (!problems.length && seen.has(slot.id)) problems.push(`the id "${slot.id}" is used twice`);
    if (problems.length) {
      console.error(`Slot #${index} (${slot?.id ?? "unknown"}) was skipped:\n- ${problems.join("\n- ")}`);
      return false;
    }
    seen.add(slot.id);
    return true;
  });

  const results = await Promise.allSettled(valid.map(async (slot) => {
    loadSlotStyle(slot);
    return slot.init(createContext(slot));
  }));

  return results.map((result, index) => {
    const slot = valid[index];
    if (result.status === "fulfilled") return { slot, layer: result.value ?? null };
    console.error(`Slot "${slot.id}" failed in init():`, result.reason);
    return { slot, error: result.reason };
  });
}
