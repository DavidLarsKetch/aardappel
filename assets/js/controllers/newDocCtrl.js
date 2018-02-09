"use strict";

angular.module("DocApp").controller("NewDocCtrl", function($scope, $location, $routeParams, $window, DocFactory, TeamFactory, SegmentFactory) {
  $scope.test = "Sup, NewDocCtrl";
  
  //Verifies user has access to team, redirecting to team-login view if not
  const loggedInUid = firebase.auth().currentUser.uid;
  TeamFactory.verifyUserAccess($routeParams.team_id, loggedInUid)
  .then(teamData => $scope.team = teamData)
  .catch(() => $location.path('/team-login'));

  // Only runs on success of TeamFactory.verifyUserAccess()
  let docID;
  $scope.doc = {
    uid: loggedInUid,
    completed: false,
    team_id: $routeParams.team_id,
    text: '',
    title: ''
  };

  // Creates an array of promises that once every deletion is successful,
  // returns user to all-docs view for that team.
  const deleteSegments = segments => {
    let keys = Object.keys(segments);
    let promises = [];
    keys.forEach(key => promises.push(SegmentFactory.deleteSegment(key)));
    Promise.all(promises)
    .then(() => $location.path(`/docs/${$routeParams.team_id}`))
    .catch(err => console.log(err));
  };

  $scope.deleteDoc = () => {
    if (docID) {
      DocFactory.deleteDoc(docID)
      .then(() => SegmentFactory.getSegments(docID))
      .then(data => deleteSegments(data)) // Delete segs in db
      .catch(err => $location.path(`docs/${$routeParams.team_id}`));
    } else {
      $window.location.href = `#!/docs/${$routeParams.team_id}`;
    }
  };
// TODO: (1) Segment text. (2) Not use a text area, in order to have <span>
// elements in the new doc.
  $scope.saveDoc = () => {
    if ($scope.doc.title !== '' && $scope.doc.text !== '') {
      DocFactory.postDoc($scope.doc)
      .then(() => $location.path(`/docs/${$routeParams.team_id}`))
      .catch(err => console.log(err));
    }
  };
});
