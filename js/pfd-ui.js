export function registerUIHandlers(el, data) {

  // Tooltip
  el.addEventListener("mousemove", evt => {
    const tip = document.getElementById("pfd-tooltip");
    tip.style.display = "block";
    tip.style.left = evt.pageX + 15 + "px";
    tip.style.top = evt.pageY + 15 + "px";
    tip.innerHTML = `<strong>${data.id}</strong><br>${data.name || data.type}`;
  });

  el.addEventListener("mouseleave", () => {
    document.getElementById("pfd-tooltip").style.display = "none";
  });

  // Click → side panel
  el.addEventListener("click", () => {
    const panel = document.getElementById("pfd-sidepanel");
    const title = document.getElementById("pfd-sidepanel-title");
    const streams = document.getElementById("tab-streams");
    const equip = document.getElementById("tab-equipment");
    const inst = document.getElementById("tab-instruments");

    title.textContent = data.id;

    streams.innerHTML = data.id.startsWith("S-")
      ? formatData(data)
      : "No stream data";

    equip.innerHTML = data.type
      ? formatData(data)
      : "No equipment data";

    inst.innerHTML = data.id.includes("I-")
      ? formatData(data)
      : "No instrument data";

    panel.classList.add("open");
  });

  // Double-click → modal
  el.addEventListener("dblclick", () => {
    const modal = document.getElementById("pfd-modal");
    const overlay = document.getElementById("pfd-modal-overlay");

    document.getElementById("pfd-modal-title").textContent = data.id;
    document.getElementById("pfd-modal-body").innerHTML = formatData(data);

    modal.style.display = "block";
    overlay.style.display = "block";
  });
}

function formatData(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `<strong>${k}:</strong> ${v}<br>`)
    .join("");
}
