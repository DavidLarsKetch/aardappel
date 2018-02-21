"use strict";

angular.module("DocApp").directive("reviewNavBtns", function() {
  return {
    restrict: 'A',
    templateUrl: 'assets/partials/review-nav-btns.html',
    controller: 'ReviewNavBtnsCtrl'
  };
});
