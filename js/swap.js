/*
 * Deletes all bookmarks in @param.
 *
 * @param   tabs  Object or array of Bookmark objects.
 *
 * @return  Promise that resolves with 0 arguments.
 */
function clearGroup(tabs)
{
  return new Promise((resolve) => {
    var length = Object.keys(tabs).length

    if (length === 0) {
      resolve()
    }

    for (var key in tabs) {
      Bookmarks.remove(tabs[key].id, () => {
        if (--length === 0) {
          resolve()
        }
      })
    }
  })
}

/*
 * Gets all opened tabs in current Chrome window.
 *
 * @return  Promise that resolves with 1 argument:
 *          An object of open tabs where keys are their ids.
 */
function getCurrentTabs()
{
  return new Promise((resolve) => {
    var current = []
    Tabs.getAllInWindow(null, (tabs) => {
      var formatted = {}
      tabs.forEach((tab) => {
        formatted[tab.id] = tab
      })
      resolve(formatted)
    })
  })
}

/*
 * Overrides given bookmark group with all opened tabs.
 *
 * @param   id      String id of bookmark folders.
 * @param   groups  Object of bookmark folders where keys are their ids.
 *
 * @return  Promise that resolves with 1 argument:
 *          An object of open tabs where keys are their ids.
 */
function saveTabs(id, groups)
{
  return new Promise((fine) => {
    clearGroup(groups[id].children).then(() => {
      getCurrentTabs().then((tabs) => {
        fine(tabs)
        for (var key in tabs) {
          Bookmarks.create({
            parentId: id,
            title: tabs[key].title,
            index: tabs[key].index,
            url: tabs[key].url
          })
        }
      })
    })
  })
}

/*
 * Opens given tabs in current Chrome window.
 *
 * @param   tabs  Object or array of Bookmark objects.
 *
 * @return  undefined
 */
function openTabs(tabs)
{
  if (Object.keys(tabs).length === 0) {
    Tabs.create({})
    return false
  }

  for (var key in tabs) {
    Tabs.create({
      url: tabs[key].url,
      index: tabs[key].index
    })
  }
}

/*
 * Closes given tabs in current Chrome window.
 *
 * @param   tabs  Object or array of Bookmark objects.
 *
 * @return  undefined
 */
function closeTabs(tabs)
{
  for (var key in tabs) {
    Tabs.remove(tabs[key].id)
  }
}
