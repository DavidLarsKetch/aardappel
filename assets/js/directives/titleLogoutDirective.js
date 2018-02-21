"use strict";

angular.module("DocApp").directive("titleLogout", function () {
  return {
    restrict: 'A',
    templateUrl: 'assets/partials/title-logout.html',
    controller: "TitleLogoutCtrl"
  };
});
