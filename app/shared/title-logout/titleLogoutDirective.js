"use strict";

angular.module("DocApp").directive("titleLogout", function () {
  return {
    restrict: 'A',
    templateUrl:
      'app/shared/title-logout/title-logout.html',
    controller: "TitleLogoutCtrl"
  };
});
