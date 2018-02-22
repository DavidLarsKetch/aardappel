"use strict";

angular.module("DocApp").controller("TeamNameCtrl", function(
  $scope,
  NavServices,
  TeamFactory
) {
  const loggedInUid = firebase.auth().currentUser.uid;
  const thisTeamsID = NavServices.go.getTeamsID();

  $scope.toNewDoc = () => NavServices.go.toNewDoc(thisTeamsID);

////// Verifies user has access to team, redirects to team-login if not
  TeamFactory.verifyUserAccess(thisTeamsID, loggedInUid)
    // Gets the team's display name
  .then(({displayName}) => $scope.teamName = displayName)
  .catch(() => NavServices.go.toTeamsLogin());
});
