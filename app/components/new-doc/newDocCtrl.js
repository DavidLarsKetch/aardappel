"use strict";

angular.module("DocApp").controller("NewDocCtrl",
function(
  $scope, $q,
  NavServices,
  DocFactory, SegmentFactory, TeamFactory
) {

  //Verifies user has access to team, redirecting to team-login view if not
  const loggedInUid = firebase.auth().currentUser.uid;
  const thisTeamsID = NavServices.go.getTeamsID();

  TeamFactory.verifyUserAccess(thisTeamsID, loggedInUid)
  .then(teamData => $scope.team = teamData)
  .catch(() => NavServices.go.toTeamsLogin());

  // Only runs on success of TeamFactory.verifyUserAccess()
  let docID,
  promises = [],
  segmentedArray = [],
  segmentedObj = [];

  $scope.text = '';
  $scope.doc = {
    uid: loggedInUid,
    completed: false,
    team_id: thisTeamsID,
    title: ''
  };

  // Creates an array of promises that, once every deletion is successful,
  // returns user to all-docs view for that team.
  const deleteSegments = segments => {
    let keys = Object.keys(segments);
    let promises = [];
    keys.forEach(key => promises.push(SegmentFactory.deleteSegment(key)));
    $q.all(promises)
    .then(() => NavServices.go.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));
  };

  $scope.deleteDoc = () => {
    if (docID) {
      DocFactory.deleteDoc(docID)
      .then(() => SegmentFactory.getSegments(docID))
      .then(data => deleteSegments(data)) // Delete segs in db
      .catch(err => NavServices.go.toAllDocs(thisTeamsID));
    } else {
      NavServices.go.toAllDocs(thisTeamsID);
    }
  };
// TODO: (1) Not use a text area, in order to have <span>
// elements in the new doc.
  $scope.saveDoc = () => {
    if ($scope.doc.title !== '' && $scope.text !== '') {
      DocFactory.postDoc($scope.doc)
      .then(firebaseID => {
        segmentedArray = SegmentFactory.segmentText($scope.text);
        for (let i = 0; i < segmentedArray.length; i++) {
          let segment = {};
          segment.text = segmentedArray[i];
          segment.doc_id = firebaseID;
          segment.doc_order = i;
          promises.push(SegmentFactory.postSegment(segment));
        }
        return $q.all(promises);
      })
      .then(() => NavServices.go.toAllDocs(thisTeamsID))
      .catch(err => console.log(err));
    }
  };
});
