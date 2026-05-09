/* ============================================================
   Modular Header Loader — Houston Chemical & Energy AI Consulting
   Loads header.html into the #header container on every page.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header");

    if (!headerContainer) return;

    fetch("/header.html")
        .then(response => {
            if (!response.ok) {
                console.error("Failed to load header.html:", response.status);
                return "";
            }
            return response.text();
        })
        .then(html => {
            headerContainer.innerHTML = html;
        })
        .catch(err => {
            console.error("Error loading header:", err);
        });
});
