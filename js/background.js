chrome.tabs.onCreated.addListener((tab) => {
  exec(tab, (tabs, tab) => {
    tabs.push(parseTabInfo(tab, true))

    return tabs
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  exec(tab, (tabs, tab) => {
    let key = getKeyWhere({id: tab.id}, tabs)

    if (key) {
      tabs[key] = parseTabInfo(tab, true)
    }

    return tabs
  })
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  exec(tabId, (tabs, tabId) => {
    let key = getKeyWhere({id: tabId}, tabs)

    if (key) {
      tabs.splice(key, 1)
    }

    return tabs
  })
})

function exec(tab, callback)
{
  chrome.storage.sync.get('groups', (result) => {
    if (!(result.groups === undefined || result.groups.length === 0)) {
      var groups = JSON.parse(result.groups),
          current = getKeyWhere({active: 1}, groups)

      tabs = callback(groups[current], tab)

      groups[current].tabs = tabs

      save(groups)
    }
  })
}
