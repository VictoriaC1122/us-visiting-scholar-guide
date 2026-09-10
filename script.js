const tabButtons = Array.from(document.querySelectorAll("[role='tab'][data-tab]"));
const tabPanels = Array.from(document.querySelectorAll("[role='tabpanel']"));
const mobileSelect = document.querySelector("#mobile-tab-select");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const validTabs = new Set(tabButtons.map((button) => button.dataset.tab));

function tabFromHash() {
  const requested = window.location.hash.slice(1);
  return validTabs.has(requested) ? requested : "overview";
}

function activateTab(tabId, options = {}) {
  const { updateHistory = false, focusTab = false, scroll = false } = options;
  const activeButton = tabButtons.find((button) => button.dataset.tab === tabId);
  const activePanel = tabPanels.find((panel) => panel.id === tabId);

  if (!activeButton || !activePanel) return;

  tabButtons.forEach((button) => {
    const selected = button === activeButton;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  tabPanels.forEach((panel) => {
    const selected = panel === activePanel;
    panel.classList.toggle("active", selected);
    panel.hidden = !selected;
  });

  mobileSelect.value = tabId;

  if (updateHistory && window.location.hash !== `#${tabId}`) {
    window.history.pushState({ tab: tabId }, "", `#${tabId}`);
  }

  if (focusTab) activeButton.focus();

  if (scroll) {
    activePanel.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  }
}

tabButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab, { updateHistory: true, scroll: true });
  });

  button.addEventListener("keydown", (event) => {
    const destinations = {
      ArrowLeft: (index - 1 + tabButtons.length) % tabButtons.length,
      ArrowRight: (index + 1) % tabButtons.length,
      Home: 0,
      End: tabButtons.length - 1,
    };

    if (!(event.key in destinations)) return;
    event.preventDefault();
    activateTab(tabButtons[destinations[event.key]].dataset.tab, {
      updateHistory: true,
      focusTab: true,
    });
  });
});

mobileSelect.addEventListener("change", () => {
  activateTab(mobileSelect.value, { updateHistory: true, scroll: true });
});

document.querySelectorAll("[data-tab-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    activateTab(link.dataset.tabTarget, { updateHistory: true, scroll: true });
  });
});

window.addEventListener("hashchange", () => activateTab(tabFromHash(), { scroll: true }));
window.addEventListener("popstate", () => activateTab(tabFromHash()));
activateTab(tabFromHash());

const checklistItems = Array.from(document.querySelectorAll("[data-check]"));
const checkedCount = document.querySelector("#checked-count");
const totalCount = document.querySelector("#total-count");
const progressFill = document.querySelector("#progress-fill");
const progressTrack = document.querySelector("[role='progressbar']");
const resetButton = document.querySelector("#reset-checklist");
const storageKey = "visiting-scholar-guide-checklist-v1";

function readChecklist() {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function writeChecklist(state) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The checklist still works for the current page when storage is unavailable.
  }
}

function updateProgress() {
  const completed = checklistItems.filter((item) => item.checked).length;
  const total = checklistItems.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  checkedCount.textContent = String(completed);
  totalCount.textContent = String(total);
  progressFill.style.width = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
}

const savedChecklist = readChecklist();
checklistItems.forEach((item) => {
  item.checked = Boolean(savedChecklist[item.dataset.check]);
  item.addEventListener("change", () => {
    const state = readChecklist();
    state[item.dataset.check] = item.checked;
    writeChecklist(state);
    updateProgress();
  });
});
updateProgress();

resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("要清除這台裝置上保存的全部勾選進度嗎？");
  if (!shouldReset) return;
  checklistItems.forEach((item) => { item.checked = false; });
  try { window.localStorage.removeItem(storageKey); } catch {}
  updateProgress();
});

document.querySelector("#print-guide").addEventListener("click", () => window.print());
