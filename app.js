function rc() {
  var r = ["https://cors-anywhere.herokuapp.com/", "https://crossorigin.me/"];
  return r[Math.floor(Math.random()*r.length)]
}

-(function() {
  angular.module('AVA', [
    'ngRoute',
    "com.2fdevs.videogular",
    "com.2fdevs.videogular.plugins.controls",
    "com.2fdevs.videogular.plugins.poster",
    "com.2fdevs.videogular.plugins.dash",
    "com.2fdevs.videogular.plugins.buffering",
  ], ['$routeProvider', '$sceProvider', function($routeProvider, $sceProvider) {
    $sceProvider.enabled(false);
    $routeProvider.
    when('/search', {
      templateUrl: 'search.html',
      controller: 'videosSearchCtrl'
    }).
    when('/play/:id', {
      templateUrl: 'play.html',
      controller: 'videosPlayCtrl'
    }).
    otherwise({
      redirectTo: '/search'
    });
  }]).controller('videosPlayCtrl', ['$scope', '$sce', '$http', '$routeParams', function($scope, $location, $http, $routeParams) {
    $scope.onPlayerReady = function(API) {
      var r = $http.get(rc()+"https://api.rtvslo.si/ava/getRecording/" + $routeParams.id + "?client_id=19cc0556a5ee31d0d52a0e30b0696b26");

      r.success(function(data, status, headers, config) {
        $scope.video = data.response;
        var src = $scope.video.mediaFiles[0];
        $scope.video.download = src.streamers['http'] + "/" + src.filename;
        $scope.config.sources = [{
          src: $scope.video.download,
          type: "video/mp4"
        }]
      });
    };
    $scope.config = {
      preload: "none",
      sources: [],
      theme: {
        url: "https://cdn.rawgit.com/videogular/bower-videogular-themes-default/master/videogular.min.css"
      }
    };
  }]).controller('videosSearchCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    $scope.videos = [];
    $scope.orderProp = "views";

    /**
     * A fresh search. Reset the scope variables to their defaults, set
     * the q query parameter, and load more results.
     */
    $scope.search = function() {
      $scope.videos = [];
      $scope.orderProp = "broadcastDate";
      var r = $http.get(rc()+"https://api.rtvslo.si/ava/getSearch?client_id=19cc0556a5ee31d0d52a0e30b0696b26&mediaType=video&q=" + $scope.q);

      r.success(function(data, status, headers, config) {
        $scope.videos = data.response.recordings;
      });

    };

    $scope.top = function() {
      var r = $http.get(rc()+"https://api.rtvslo.si/ava/getRecordingsByViews?interval=day&client_id=19cc0556a5ee31d0d52a0e30b0696b26");

      r.success(function(data, status, headers, config) {
        $scope.videos = data.response.recordings;
      });
    }

    $scope.top();
  }]);

})(document);
