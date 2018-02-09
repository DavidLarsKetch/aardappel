"use strict";

angular.module("DocApp").controller("TeamRegisterCtrl", function($scope, $location, TeamFactory) {
  $scope.test = "Sup, TeamRegisterCtrl";
  $scope.team = {
    displayName: '',
    password: '',
    users: [firebase.auth().currentUser.uid],
    owner: firebase.auth().currentUser.uid
  };

  $scope.registerTeam = () => {
    if($scope.team.password === $scope.reenter)
    // TODO: Check for whether team name already exists, deny registration if so
      TeamFactory.postTeam($scope.team)
      .then(teamID => {
        $location.path(`/docs/${teamID}`);
      });
  };
});
