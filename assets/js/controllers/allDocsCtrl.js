"use strict";

angular.module("DocApp").controller("AllDocsCtrl", function($scope, $location, $routeParams, TeamFactory) {
  $scope.test = "Sup, AllDocsCtrl";
    }
  })
  .catch(err => console.log(err));
  //Verifies user has access to team, redirects to team-login otherwise
  TeamFactory.verifyUserAccess($routeParams.team_id, loggedInUid)
  .then(team => getDataForPage(team)) // Kicks off getting data for page
  .catch(() => $location.path('/team-login'));
});
