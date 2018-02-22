"use strict";

angular.module("DocApp").directive("reviewNavBtns", function() {
  return {
    restrict: 'A',
    templateUrl: 'app/components/review/review-nav-btns.html',
    controller: 'ReviewNavBtnsCtrl'
  };
});
