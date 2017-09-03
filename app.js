var app = angular.module('app', [])

app.controller('GroupController', function GroupController($scope) {
  $scope.groups = []
  $scope.new = ''

  chrome.storage.sync.get('groups', (result) => {
    if (!(result.groups === undefined || result.groups.length === 0)) {
      $scope.groups = JSON.parse(result.groups)
      $scope.$apply()
    }
  })

  $scope.delete = (id) => {
    $scope.groups.splice(id, 1)

    save($scope.groups)
  }

  $scope.add = () => {
    if ($scope.new.trim() === '') {
      return false
    }

    if ($scope.groups.length === 0) {
      return $scope.init()
    }

    $scope.groups.push({
      active: 0,
      name: $scope.new,
      tabs: [{}]
    })

    $scope.new = ''

    save($scope.groups)
  }

  $scope.init = () => {
    $scope.getCurrentTabs().then((tabs) => {
      $scope.groups.push({
        active: 1,
        name: $scope.new,
        tabs: tabs
      })

      $scope.new = ''

      $scope.$apply()

      save($scope.groups)
    })

    return true
  }

  $scope.swap = (id) => {
    if ($scope.groups[id].active === 1) {
      return false
    }

    let current = getKeyWhere({active: 1}, $scope.groups)

    $scope.groups[current].active = 0
    $scope.groups[id].active = 1

    save($scope.groups)

    $scope.closeTabs(current)

    $scope.openTabs(id)
  }

  $scope.openTabs = (id) => {
    for (let key in $scope.groups[id].tabs) {
      chrome.tabs.create(parseTabInfo($scope.groups[id].tabs[key]), (tab) => {
        $scope.groups[id].tabs[key].id = tab.id
      })
    }

    save($scope.groups)
  }

  $scope.closeTabs = (id) => {
    chrome.tabs.getAllInWindow(null, (tabs) => {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.remove(tabs[i].id)
      }
    })
  }

  $scope.getCurrentTabs = () => {
    let promise = new Promise((resolve, reject) => {
      var current = []
      chrome.tabs.getAllInWindow(null, (tabs) => {
        var length = tabs.length
        for (var i = 0; i < tabs.length; i++) {
          chrome.tabs.get(tabs[i].id, (tab) => {
            current.push(parseTabInfo(tab, true))

            if (--length === 0) {
              resolve(current)
            }
          })
        }
      })
    })

    return promise
  }
})
