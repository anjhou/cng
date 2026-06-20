import { loadPFDData } from "./pfd-api.js";
import { registerUIHandlers } from "./pfd-ui.js";

loadPFDData().then(data => {
  const svgObj = document.getElementById("pfd-svg");

  svgObj.addEventListener("load", () => {
    const svg = svgObj.contentDocument;

    svg.querySelectorAll("[data-id]").forEach(el => {
      const id = el.getAttribute("data-id");
      const info =
        data.streams[id] ||
        data.equipment[id];

      if (!info) return;

      registerUIHandlers(el, info);
    });
  });
});
