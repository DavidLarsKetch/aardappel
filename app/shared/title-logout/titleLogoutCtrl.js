"use strict";

angular.module("DocApp").controller("TitleLogoutCtrl",
function(
  $scope,
  BoolServices, NavServices,
  AuthFactory
) {
  // TODO: Pull title from somewhere else
  $scope.appTitle = "Doc Editor";

  // Checks whether all-docs partial is being shown in order to display
  // 'Switch Teams' btn, looks at a variable only existing on AllDocsCtrl
  $scope.checkIfAllDocs = variable => BoolServices.notUndefined(variable);


  $scope.switchTeams = () => NavServices.go.toTeamsLogin();

  $scope.logout = () =>
    AuthFactory.logout()
    .then(() => NavServices.go.toLogin());
});
