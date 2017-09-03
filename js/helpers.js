function parseTabInfo(tab, id = false)
{
  let parsed = {
    url: tab.url,
    index: tab.index,
    active: tab.active,
    pinned: tab.pinned,
  }

  if (id) {
    parsed.id = tab.id
  }

  return parsed
}

function getKeyWhere(pair, groups)
{
  var param = Object.keys(pair)[0]
  var value = Object.values(pair)[0]

  for (let key in groups) {
    if (groups[key][param] === value) {
      return key
    }
  }

  return false
}

function getTabKey(groups, id)
{
  for (let key in groups) {
    if (groups[key].id === id) {
      return key
    }
  }

  return false
}

function save(groups)
{
  chrome.storage.sync.set({'groups': JSON.stringify(groups)})
}
