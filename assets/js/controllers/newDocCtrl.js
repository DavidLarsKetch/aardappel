"use strict";

angular.module("DocApp").controller("NewDocCtrl", function($scope, $location, $routeParams, TeamFactory) {
  $scope.test = "Sup, NewDocCtrl";
  
  //Verifies user has access to team, redirecting to team-login view if not
  const loggedInUid = firebase.auth().currentUser.uid;
  TeamFactory.verifyUserAccess($routeParams.team_id, loggedInUid)
  .then(teamData => $scope.team = teamData)
  .catch(() => $location.path('/team-login'));

  // Only runs on success of TeamFactory.verifyUserAccess()
    } else {
      $location.path('/team-login');
    }
  })
  .catch(err => console.log(err));
});
