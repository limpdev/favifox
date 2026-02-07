// public/content-script.js
;(async () => {
  const api = typeof browser !== 'undefined' ? browser : chrome

  // Wait for rules
  let rules = []
  try {
    const storage = await api.storage.sync.get('rules')
    rules = storage.rules || []
  } catch (e) {
    console.error('Favifox: Could not fetch rules', e)
    return
  }

  const currentUrl = window.location.href
  const activeRule = rules.find(rule => {
    if (!rule.enabled) return false
    try {
      if (rule.matchType === 'regex')
        return new RegExp(rule.pattern).test(currentUrl)
      if (rule.matchType === 'exact') return currentUrl === rule.pattern
      return currentUrl.includes(rule.pattern)
    } catch (e) {
      return false
    }
  })

  if (!activeRule) return

  // Determine Icon URL
  let targetIconUrl = activeRule.value
  if (activeRule.sourceType === 'preset') {
    targetIconUrl = api.runtime.getURL(`presets/${activeRule.value}`)
  }

  // --- THE ENFORCER ---

  const DO_NOT_TOUCH_CLASS = 'favifox-icon'

  function nukeAndPlant () {
    const head = document.head || document.documentElement

    // 1. Find all existing icons
    const icons = document.querySelectorAll("link[rel*='icon']")
    let ourIconExists = false

    icons.forEach(icon => {
      // If it's our icon, leave it alone
      if (
        icon.classList.contains(DO_NOT_TOUCH_CLASS) &&
        icon.href === targetIconUrl
      ) {
        ourIconExists = true
        return
      }
      // If it's an enemy icon, destroy it
      icon.parentNode.removeChild(icon)
    })

    // 2. Plant our icon if missing
    if (!ourIconExists) {
      const link = document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = targetIconUrl
      link.classList.add(DO_NOT_TOUCH_CLASS)
      head.appendChild(link)
    }
  }

  // Initial Run
  nukeAndPlant()

  // 3. Watch for insubordination
  // We use a MutationObserver to watch for ANY changes to <head>
  const observer = new MutationObserver(mutations => {
    let shouldAct = false

    mutations.forEach(mutation => {
      // Check added nodes
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'LINK' && node.rel && node.rel.includes('icon')) {
          if (!node.classList.contains(DO_NOT_TOUCH_CLASS)) {
            shouldAct = true
          }
        }
      })

      // Check attribute changes (e.g. dynamic badge updates)
      if (
        mutation.type === 'attributes' &&
        mutation.target.nodeName === 'LINK' &&
        mutation.target.rel.includes('icon')
      ) {
        if (!mutation.target.classList.contains(DO_NOT_TOUCH_CLASS)) {
          shouldAct = true
        }
      }
    })

    if (shouldAct) {
      nukeAndPlant()
    }
  })

  // Start observing
  const head = document.head || document.documentElement
  observer.observe(head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'rel']
  })

  // Backup: Periodic check (every 2 seconds) just in case observer misses something crazy
  setInterval(nukeAndPlant, 2000)
})()
