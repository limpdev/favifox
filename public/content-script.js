// public/content-script.js

(async () => {
  const { rules } = await browser.storage.sync.get("rules");
  if (!rules) return;

  const currentUrl = window.location.href;

  const activeRule = rules.find((rule) => {
    if (!rule.enabled) return false;

    if (rule.matchType === "regex") {
      try {
        const regex = new RegExp(rule.pattern);
        return regex.test(currentUrl);
      } catch (e) {
        return false;
      }
    } else {
      return currentUrl.includes(rule.pattern);
    }
  });

  if (activeRule) {
    updateFavicon(activeRule);
  }
})();

function updateFavicon(rule) {
  let iconUrl = rule.value;

  // Handle presets pathing
  if (rule.sourceType === "preset") {
    iconUrl = browser.runtime.getURL(`presets/${rule.value}`);
  }

  const setIcon = () => {
    const links = document.querySelectorAll("link[rel*='icon']");
    // Remove existing
    links.forEach((link) => link.remove());

    // Create new
    const link = document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = iconUrl;
    document.getElementsByTagName("head")[0].appendChild(link);
  };

  // Run immediately
  setIcon();

  // Watch for dynamic changes (SPAs like React/Vue apps often overwrite head)
  const observer = new MutationObserver(setIcon);
  observer.observe(document.querySelector("head"), {
    childList: true,
    subtree: true,
  });
}
