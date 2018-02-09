"use strict";

angular.module("DocApp").controller("ReviewPendingCtrl", function($scope, $location, $routeParams, $window, DocFactory, TeamFactory, UserFactory) {
  $scope.test = "Sup, ReviewPendingCtrl";
  //Verifies user has access to team, redirects to team-login if not
  const loggedInUid = firebase.auth().currentUser.uid;

  TeamFactory.verifyUserAccess($routeParams.team_id, loggedInUid)
  .then(teamData => $scope.team = teamData)
  .catch(() => $location.path('/team-login'));

  $scope.cancel = () => {
    // TODO: Delete doc & segments associated with suggested edits, redirect
    // with $location on successful deletion to all-docs
    $window.location.href = `#!/docs/${$routeParams.team_id}`;
  };

  $scope.completed = () => {
    $scope.doc.completed = true;
    $scope.doc.reviewer = loggedInUid;
    //Pass through segmentation
    DocFactory.putDoc($scope.doc)
    .then(() => $location.path(`docs/${$routeParams.team_id}`))
    .catch(err => console.log(err));
  };

  $scope.save = () => {
    // TODO: Force save, removing temp files, redirects to all-docs
  };

  DocFactory.getDoc($routeParams.doc_id)
  .then(doc => {
    $scope.doc = doc;
    return UserFactory.getUser(doc.uid);
  })
  .then(userData => $scope.doc.displayName = userData.displayName)
  .catch(err => console.log(err));
});
