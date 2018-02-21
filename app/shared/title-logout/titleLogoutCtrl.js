"use strict";

angular.module("DocApp").controller("TitleLogoutCtrl",
function(
  $scope,
  NavServices,
  AuthFactory
) {

  $scope.appTitle = "Doc Editor";
  $scope.switchTeams = () => NavServices.go.toTeamsLogin();
  $scope.logout = () =>
    AuthFactory.logout()
    .then(() => NavServices.go.toLogin());
});
