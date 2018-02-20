"use strict";

angular.module("DocApp").controller("LoginCtrl",
function(
  $scope,
  NavServices,
  AuthFactory, UserFactory
) {

  $scope.auth = {};
  $scope.user = {};

  $scope.login = () =>
    AuthFactory.login($scope.auth)
    .then(() => NavServices.toTeamsLogin());

  $scope.logout = () => AuthFactory.logout();

  $scope.registerEmail = () => {
    if($scope.user.displayName)
    AuthFactory.registerEmail($scope.auth)
    .then(({uid}) => {
      $scope.user.uid = uid;
      UserFactory.registerDisplayName($scope.user);
    })
    .then(() => $scope.login());
  };
});
