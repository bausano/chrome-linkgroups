const Bookmarks = chrome.bookmarks
const Storage = chrome.storage
const Tabs = chrome.tabs

var app = angular.module('app', [])

app.controller('GroupController', function GroupController($scope) {
  $scope.groups = {}
  $scope.new = ''
  $scope.active = false

  $scope.init = () => {
    var promise = new Promise((resolve, reject) => {
      Bookmarks.search({title: 'Linkgroups-extension'}, (root) => {
        if (root.length === 0) {
          Bookmarks.create({title: 'Linkgroups-extension'},
            (new_root) => {
              $scope.setActive(false)
              resolve(new_root)
            })
        } else {
          resolve(root[0])
        }
      })
    })

    promise.then((root) => {
      $scope.root = root
      Storage.sync.get('active', (result) => {
        var active = result.active
        if (!(active === undefined || active.length === 0)) {
          $scope.setActive(active)
        }

        $scope.reloadGroups()
      })
    })
  }

  $scope.init()

  $scope.reloadGroups = () => {
    $scope.groups = {}
    Bookmarks.getSubTree($scope.root.id, (tree) => {
      tree = tree[0].children
      tree.forEach((group) => {
        var tabs = {}
        group.children.forEach((tab) => {
          tabs[tab.id] = tab
        })
        group.children = tabs
        $scope.groups[group.id] = group
      })

      let ids = Object.keys($scope.groups)
      if (!$scope.active && ids.length > 0) {
        $scope.setActive($scope.groups[ids[0]].id)
      }

      $scope.$apply()
    })
  }

  $scope.setActive = (id) => {
    $scope.active = id

    Storage.sync.set({'active': id}, () => {$scope.$apply()})
  }

  $scope.add = () => {
    if ($scope.new === '') {
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

  $scope.delete = (id) => {
    Bookmarks.removeTree($scope.groups[id].id, () => {
      $scope.reloadGroups()
    })
  }

  $scope.swap = (id) => {
    var group = $scope.groups[id]
    $scope.saveTabs($scope.active).then((tabs) => {
      $scope.openTabs(group.id)

      $scope.closeTabs(tabs)

      $scope.setActive(group.id)

      $scope.reloadGroups()
    })
  }

  $scope.saveTabs = (id) => {
    return new Promise((fine) => {
      $scope.clearGroup(id).then(() => {
        $scope.getCurrentTabs().then((tabs) => {
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

  $scope.clearGroup = (id) => {
    return new Promise((resolve, reject) => {
      var tabs = $scope.groups[id].children,
          length = Object.keys(tabs).length

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

  $scope.openTabs = (id) => {
    var tabs = $scope.groups[id].children
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

  $scope.closeTabs = (tabs) => {
    for (var key in tabs) {
      Tabs.remove(tabs[key].id)
    }
  }

  $scope.getCurrentTabs = () => {
    return new Promise((resolve, reject) => {
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
})
