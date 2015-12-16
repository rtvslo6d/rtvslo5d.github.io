function rc() {
  var r = ["https://cors-anywhere.herokuapp.com/", "https://crossorigin.me/"];
  return r[Math.floor(Math.random() * r.length)]
}

- (function() {
  angular.module("com.2fdevs.videogular.plugins.dash", [])
    .directive(
      "vgDash", [function() {
        return {
          restrict: "A",
          require: "^videogular",
          link: function(scope, elem, attr, API) {
            var context;
            var player;
            var dashCapabilitiesUtil = new MediaPlayer.utils.Capabilities();
            var dashTypeRegEx = /^application\/dash\+xml/i;

            //Proceed augmenting behavior only if the browser is capable of playing DASH (supports MediaSource Extensions)
            if (dashCapabilitiesUtil.supportsMediaSource()) {

              //Returns true if the source has the standard DASH type defined OR an .mpd extension.
              scope.isDASH = function isDASH(source) {
                var hasDashType = dashTypeRegEx.test(source.type);
                var hasDashExtension = source.src.indexOf && (source.src.indexOf(".mpd") > 0);

                return hasDashType || hasDashExtension;
              };

              scope.onSourceChange = function onSourceChange(source) {
                var url = source.src;

                // It's DASH, we use Dash.js
                if (scope.isDASH(source)) {
                  player = new MediaPlayer(new Dash.di.DashContext());
                  player.setAutoPlay(API.autoPlay);
                  player.startup();
                  player.attachView(API.mediaElement[0]);
                  player.attachSource(url);
                  player.setAutoSwitchQuality(0);
                } else if (player) {
                  //not DASH, but the Dash.js player is still wired up
                  //Dettach Dash.js from the mediaElement
                  player.reset();
                  player = null;

                  //player.reset() wipes out the new url already applied, so have to reapply
                  API.mediaElement.attr('src', url);
                  API.stop();
                }
              };

              scope.$watch(
                function() {
                  return API.sources;
                },
                function(newVal, oldVal) {
                  scope.onSourceChange(newVal[0]);
                }
              );
            }
          }
        }
      }]);

  angular.module('AVA', [
    'ngRoute',
    "com.2fdevs.videogular",
    "com.2fdevs.videogular.plugins.controls",
    "com.2fdevs.videogular.plugins.poster",
    "com.2fdevs.videogular.plugins.dash",
    "com.2fdevs.videogular.plugins.buffering",
    "com.2fdevs.videogular.plugins.overlayplay",
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
      var r = $http.get(rc() + "https://api.rtvslo.si/ava/getRecording/" + $routeParams.id + "?client_id=19cc0556a5ee31d0d52a0e30b0696b26");

      r.success(function(data, status, headers, config) {
        $scope.video = data.response;
        $scope.video.download = $scope.video.mediaFiles[0].streamers['http'] + "/" + $scope.video.mediaFiles[0].filename;
        $scope.config.sources = [{
          src: $scope.video.addaptiveMedia['mpeg-dash'],
          type: "application/dash+xml"
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
      var r = $http.get(rc() + "https://api.rtvslo.si/ava/getSearch?client_id=19cc0556a5ee31d0d52a0e30b0696b26&mediaType=video&q=" + $scope.q);

      r.success(function(data, status, headers, config) {
        $scope.videos = data.response.recordings;
      });

    };

    $scope.top = function() {
      var r = $http.get(rc() + "https://api.rtvslo.si/ava/getRecordingsByViews?interval=day&client_id=19cc0556a5ee31d0d52a0e30b0696b26");

      r.success(function(data, status, headers, config) {
        $scope.videos = data.response.recordings;
      });
    }

    $scope.top();
  }]);

})(document);
