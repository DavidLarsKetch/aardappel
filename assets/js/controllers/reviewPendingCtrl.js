"use strict";

angular.module("DocApp").controller("ReviewPendingCtrl", function($scope, $location, $routeParams, TeamFactory) {
  $scope.test = "Sup, ReviewPendingCtrl";
  //Verifies user has access to team, redirects to team-login if not
  const loggedInUid = firebase.auth().currentUser.uid;
  TeamFactory.verifyUserAccess($routeParams.team_id, loggedInUid)
  .then(teamData => $scope.team = teamData)
  .catch(() => $location.path('/team-login'));
});
