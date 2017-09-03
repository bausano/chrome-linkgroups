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

    $scope.save()
  }

  $scope.add = () => {
    if ($scope.new.trim() === '') {
      return false
    }

    $scope.getCurrentTabs().then((tabs) => {
      $scope.groups.push({
        active: 0,
        name: $scope.new,
        tabs: tabs
      })

      $scope.swap($scope.groups.length - 1)

      $scope.new = ''
    })
  }

  $scope.swap = (id) => {
    if ($scope.groups[id].active === 1) {
      return false
    }

    let current = $scope.current()


    $scope.groups[current].active = 0
    $scope.groups[id].active = 1

    console.log($scope.groups)

    $scope.save()

    $scope.openTabs(id)

    // TODO: Close tabs.
  }

  $scope.openTabs = (id) => {
    for (let key in $scope.groups[id].tabs) {
      chrome.tabs.create($scope.groups[id].tabs[key])
    }
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
        for (var i = 0; i < tabs.length; i++) {
          chrome.tabs.get(tabs[i].id, (tab) => {
            current.push({
              url: tab.url,
              index: tab.index,
              active: tab.active,
              pinned: tab.pinned,
            })
            if (i === tabs.length) {
              resolve(current)
            }
          })
        }
      })
    })

    return promise
  }

  $scope.current = () => {
    for (let key in $scope.groups) {
      if ($scope.groups[key].active === 1) {
        return key
      }
    }

    return 0
  }

  $scope.save = () => {
    chrome.storage.sync.set({'groups': JSON.stringify($scope.groups)})
  }
})
