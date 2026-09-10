const progressBar = document.querySelector("#reading-progress-bar");
const tocLinks = Array.from(document.querySelectorAll(".toc-link"));
const chapters = tocLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const mobileToc = document.querySelector(".mobile-toc");
let framePending = false;

function updateReadingState() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
  progressBar.style.width = `${progress}%`;

  let currentId = chapters[0]?.id;
  chapters.forEach((chapter) => {
    if (chapter.getBoundingClientRect().top <= 180) currentId = chapter.id;
  });

  tocLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });

  framePending = false;
}

function requestReadingUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateReadingState);
}

window.addEventListener("scroll", requestReadingUpdate, { passive: true });
window.addEventListener("resize", requestReadingUpdate);
updateReadingState();

mobileToc?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileToc.open = false;
  });
});

const appendixDetails = Array.from(document.querySelectorAll(".appendix-list details"));
let detailsOpenState = [];

window.addEventListener("beforeprint", () => {
  detailsOpenState = appendixDetails.map((detail) => detail.open);
  appendixDetails.forEach((detail) => { detail.open = true; });
});

window.addEventListener("afterprint", () => {
  appendixDetails.forEach((detail, index) => {
    detail.open = detailsOpenState[index];
  });
});

document.querySelector("#print-note")?.addEventListener("click", () => window.print());
