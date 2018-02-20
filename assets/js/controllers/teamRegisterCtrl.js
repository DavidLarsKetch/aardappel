"use strict";

angular.module("DocApp").controller("TeamRegisterCtrl",
function(
  $scope,
  NavServices,
  TeamFactory
) {
  
  $scope.team = {
    displayName: '',
    password: '',
    users: [firebase.auth().currentUser.uid],
    owner: firebase.auth().currentUser.uid
  };

  $scope.toTeamsLogin = () => NavServices.toTeamsLogin();

  $scope.registerTeam = () => {
    if($scope.team.password === $scope.reenter)
    // TODO: Check for whether team name already exists, deny registration if so
      TeamFactory.postTeam($scope.team)
      .then(teamID => NavServices.toAllDocs(teamID));
  };
});
