const progressBar = document.querySelector("#reading-progress-bar");
const desktopTocLinks = Array.from(document.querySelectorAll(".toc-link"));
const mobileTocLinks = Array.from(document.querySelectorAll(".mobile-toc a"));
const tocLinks = [...desktopTocLinks, ...mobileTocLinks];
const chapters = desktopTocLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
let framePending = false;
let activeId = "";

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
}

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
