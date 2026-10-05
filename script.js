const progressBar = document.querySelector("#reading-progress-bar");
const desktopTocLinks = Array.from(document.querySelectorAll(".toc-link"));
const mobileTocLinks = Array.from(document.querySelectorAll(".mobile-toc a"));
const tocLinks = [...desktopTocLinks, ...mobileTocLinks];
const mobileToc = document.querySelector(".mobile-toc");
const currentChapter = document.querySelector(".current-chapter");
const languageSwitch = document.querySelector(".language-switch");
const topbar = document.querySelector(".topbar");
const chapters = desktopTocLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
let framePending = false;
let activeId = "";

function updateHeaderOffset() {
  if (!topbar) return;
  const bottom = Math.ceil(topbar.getBoundingClientRect().height +
    (parseFloat(getComputedStyle(topbar).top) || 0) + 8);
  document.documentElement.style.setProperty("--mobile-toc-top", `${bottom}px`);
}
updateHeaderOffset();
window.addEventListener("resize", updateHeaderOffset);
if (topbar && typeof ResizeObserver !== "undefined") {
  new ResizeObserver(updateHeaderOffset).observe(topbar);
}

function updateReadingState() {
  let progress = 0;
  if (progressBar) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  }

  let currentId = chapters[0]?.id;
  for (let index = chapters.length - 1; index >= 0; index -= 1) {
    if (chapters[index].getBoundingClientRect().top <= 180) {
      currentId = chapters[index].id;
      break;
    }
  }

  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;

  if (currentId && currentId !== activeId) {
    tocLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    activeId = currentId;
    if (currentChapter) {
      currentChapter.textContent = mobileTocLinks.find((link) =>
        link.getAttribute("href") === `#${currentId}`)?.textContent || "";
    }
  }

  framePending = false;
}

function requestReadingUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateReadingState);
}

if (progressBar || chapters.length) {
  window.addEventListener("scroll", requestReadingUpdate, { passive: true });
  window.addEventListener("resize", requestReadingUpdate);
  updateReadingState();
  window.addEventListener("load", requestReadingUpdate);
  if (document.fonts) document.fonts.ready.then(requestReadingUpdate);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(requestReadingUpdate).observe(document.body);
  }
}

// Close the mobile menu before native anchor navigation calculates its target.
mobileTocLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (mobileToc) mobileToc.open = false;
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });
});

mobileToc?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileToc.open) {
    mobileToc.open = false;
    mobileToc.querySelector("summary").focus();
  }
});

// Both translations use the same chapter IDs.
function syncLanguageLink() {
  if (!languageSwitch) return;
  const url = new URL(languageSwitch.href);
  url.hash = window.location.hash;
  languageSwitch.href = url.href;
}
syncLanguageLink();
window.addEventListener("hashchange", syncLanguageLink);

const appendixDetails = Array.from(document.querySelectorAll(".accordion-list details, .extra-costs"));
let detailsOpenState = [];

window.addEventListener("beforeprint", () => {
  detailsOpenState = appendixDetails.map((detail) => detail.open);
  appendixDetails.forEach((detail) => { detail.open = true; });
});

window.addEventListener("afterprint", () => {
  if (!detailsOpenState.length) return;
  appendixDetails.forEach((detail, index) => {
    detail.open = detailsOpenState[index];
  });
  detailsOpenState = [];
});

const printButton = document.querySelector("#print-note");
if (printButton) {
  printButton.hidden = false;
  printButton.addEventListener("click", () => window.print());
}
