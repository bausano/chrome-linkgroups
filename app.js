const Bookmarks = chrome.bookmarks
const Storage = chrome.storage
const Tabs = chrome.tabs
const Folder = 'Linkgroups-extension'

var app = angular.module('app', [])

app.controller('GroupController', function GroupController($scope) {
  /*
   * Initialize application.
   */
  new Promise((resolve) => {
    // Group tree where keys are bookmark ids.
    $scope.groups = {}
    // Current active group.
    $scope.active = false
    // Model binding for input.
    $scope.new = ''

    Bookmarks.search({title: Folder}, (root) => {
      if (root.length === 0) {
        Bookmarks.create({title: Folder},
          (new_root) => {
            $scope.setActive(false)
            resolve(new_root)
          })
      } else {
        resolve(root[0])
      }
    })
  }).then((root) => {
    $scope.root = root
    Storage.sync.get('active', (result) => {
      let active = result.active
      if (!(active === undefined || active.length === 0)) {
        $scope.setActive(active)
      }

      $scope.reloadGroups()
    })
  })

  /*
   * Reloads the bookmarks tree.
   */
  $scope.reloadGroups = () => {
    $scope.groups = {}
    Bookmarks.getSubTree($scope.root.id, (tree) => {
      // Sets tree to an array of bookmark folders.
      tree = tree[0].children

      // Parses tabs and groups into a {id: value} pair.
      tree.forEach((group) => {
        var tabs = {}
        group.children.forEach((tab) => {
          tabs[tab.id] = tab
        })

        group.count = group.children.length
        group.children = tabs
        $scope.groups[group.id] = group
      })

      let ids = Object.keys($scope.groups)
      if (!$scope.active && ids.length > 0) {
        $scope.setActive($scope.groups[ids[0]].id)
      }

      // Updates context menu.
      chrome.extension.sendMessage({menu: "update"})

      $scope.$apply()
    })
  }

  /*
   * Sets active group to @param(id) both locally and globally.
   *
   * @param id  Bookmark folder id.
   */
  $scope.setActive = (id) => {
    Storage.sync.set({'active': id})
    $scope.active = id
    $scope.$apply()
  }

  /*
   * Creates a new Bookmark folder.
   */
  $scope.add = () => {
    if ($scope.new === '' || $scope.new.length > 15) {
      return false
    }

    Bookmarks.create({
      title: $scope.new,
      parentId: $scope.root.id
    }, () => {
      $scope.new = ''
      $scope.reloadGroups()
    })
  }

  /*
   * Removes folder with all links.
   *
   * @param id  Bookmark folder id.
   */
  $scope.delete = (id) => {
    Bookmarks.removeTree($scope.groups[id].id, () => {
      $scope.reloadGroups()
    })
  }

  /*
   * Swaps active working group to $param(id).
   *
   * @param id  Bookmark folder id.
   *
   * @logic js/swap.js
   */
  $scope.swap = (id) => {
    var group = $scope.groups[id]
    saveTabs($scope.active, $scope.groups)
    .then((tabs) => {
      openTabs($scope.groups[group.id].children)

      closeTabs(tabs)

      $scope.setActive(group.id)

      $scope.reloadGroups()
    })
  }

  /*
   * Delete animation
   */
  $scope.animate = false

  $scope.tryToDelete = (id) => {
    $scope.animate = true
    $('#block_' + id).stop(true, true).css({
      backgroundColor: '#ffeceb',
    }).animate({
      backgroundColor: '#ff6961',
      color: '#fff'
    }, 750, () => {
      if ($scope.animate) {
        $scope.delete(id)
      }
    })
  }

  $scope.stopDeletion = (id) => {
    if ($scope.animate) {
      $scope.animate = false
      $('#block_' + id).stop(true, true).css({
        backgroundColor: 'rgba(0, 0, 0, 0)',
        color: '#647574'
      })
    }
  }
})
