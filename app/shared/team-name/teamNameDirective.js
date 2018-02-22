"use strict";

angular.module("DocApp").directive("teamName", function() {
  return {
    restrict: 'A',
    templateUrl: 'app/shared/team-name/team-name.html',
    controller: 'TeamNameCtrl'
  };
});
