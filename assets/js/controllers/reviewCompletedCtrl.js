"use strict";

angular.module("DocApp").controller("ReviewCompletedCtrl", function($scope, $location, $routeParams, DocFactory, SegmentFactory, TeamFactory, UserFactory) {
  $scope.test = "Sup, ReviewCompletedCtrl";

  //Verifies user has access to team, redirects to team-login if not
  const loggedInUid = firebase.auth().currentUser.uid;
  TeamFactory.verifyUserAccess($routeParams.team_id, loggedInUid)
  .then(teamData => $scope.team = teamData)
  .catch(() => $location.path('/team-login'));

  DocFactory.getDoc($routeParams.doc_id)
  .then(doc => {
    $scope.doc = doc;
    // Get the doc owner's display name
    return UserFactory.getUser(doc.uid);
  })
  .then(userData => {
    $scope.doc.displayName = userData.displayName;
    // Get document segments
    return SegmentFactory.getSegments($routeParams.doc_id);
  })
  .then(segments => $scope.segments = segments)
  .catch(err => console.log(err));
});
