import { createMap } from "./core/map.js";
import { initSlots } from "./core/registry.js";
import slots from "./features/index.js";

const map = createMap(document.getElementById("map"));
await initSlots(slots, (slot) => ({ map, L: window.L, slot: { id: slot.id } }));
