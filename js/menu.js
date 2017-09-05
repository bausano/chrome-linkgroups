const Bookmarks = chrome.bookmarks
const Folder = 'Linkgroups-extension'
const Menu = chrome.contextMenus

var save = (info, tab) => {
  Bookmarks.create({
    title: tab.title,
    url: tab.url,
    parentId: info.menuItemId
  })
}

function reloadMenu()
{
  Menu.removeAll()

  Bookmarks.search({title: Folder}, (root) => {
    if (root.length === 0) {
      return false
    }
    Bookmarks.getChildren(root[0].id, (groups) => {
      groups.forEach((group) => {
        Menu.create({
          id: group.id,
          title: group.title,
          contexts: ['all'],
          onclick: save
        })
      })
    })
  })
}

// If the tree was changed in the popup window, context menu gets reloaded.
chrome.extension.onMessage.addListener((request) => {
  if (request.menu === "update") {
    reloadMenu()
  }
})

reloadMenu()
