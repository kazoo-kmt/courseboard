
'use strict';

/* Services */

angular.module('courseboard.services', [])
  // .factory('Answer', ['$resource', '$window', function ($resource, $window) {
  //   return $resource($window.location.origin + '/api/questions/:questionId/answers/:id', { questionid: '@questionId', id: '@id' }, {
  //     update: { method: 'PUT' }
  //   });
  // }])

  .factory('Auth', ['$auth', function ($auth) {
    return {
      currentUser: function() {
        var user = $auth.getPayload();
        var currentUser = {
          _id: user.sub,
          email: user.email,
          picture: user.picture,
          displayName: user.displayName
        }
        return currentUser;
      }
    }
  }])

  .factory('GlobalAlert', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    var alertService;
    $rootScope.globalAlerts = [];
    return alertService = {
      add: function(type, msg, timeout) {
        $rootScope.globalAlerts = [];
        $rootScope.globalAlerts.push({
          type: type,
          msg: msg,
          close: function() {
            return alertService.closeAlert(this);
          }
        });
        if (timeout) { 
          $timeout(function(){ 
            alertService.closeAlert(this); 
          }, timeout); 
        }
      },
      closeAlert: function(alert) {
        return this.closeAlertIdx($rootScope.globalAlerts.indexOf(alert));
      },
      closeAlertIdx: function(index) {
        return $rootScope.globalAlerts.splice(index, 1);
      },
      clear: function(){
        $rootScope.globalAlerts = [];
      }
    };
  }]);