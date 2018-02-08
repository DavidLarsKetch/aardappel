"use strict";

angular.module("DocApp").controller("ReviewPendingCtrl", function($scope, $location, $routeParams, TeamFactory) {
  $scope.test = "Sup, ReviewPendingCtrl";
  const uid = firebase.auth().currentUser.uid;
  //Verifies user has access to team
  TeamFactory.getTeam($routeParams.team_id)
  .then(teamData => {
    if (teamData.users.includes(uid)) {
      $scope.team = teamData;
    } else {
      $location.path('/team-login');
    }
  })
  .catch(err => console.log(err));
});
