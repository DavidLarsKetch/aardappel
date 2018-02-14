"use strict";

angular.module("DocApp").controller("ReviewPendingCtrl", function($scope, $document, $location, $routeParams, $window, DocFactory, SegmentFactory, TeamFactory, UserFactory) {
  $scope.test = "Sup, ReviewPendingCtrl";
  //Verifies user has access to team, redirects to team-login if not
  const loggedInUid = firebase.auth().currentUser.uid;
  const thisDocID = $routeParams.doc_id;
  const thisTeamsID = $routeParams.team_id;
  const checkUndefined = str => typeof str !== "undefined";
  let loggedInDisplayName, toCheck, overwriteText,
  promises = [];

  TeamFactory.verifyUserAccess(thisTeamsID, loggedInUid)
  // Gets the team's display name
  .then(({displayName}) => {
    $scope.teamName = displayName;
    // Get logged in user's data in order to have displayName on hand for
    // making edits.
    return UserFactory.getUser(loggedInUid);
  })
  .then(({displayName}) => loggedInDisplayName = displayName)
  .catch(() => $location.path('/team-login'));

// Allows cancelling of changes made
  $scope.cancel = () => {
    // Removes changes from database before redirecting to team's docs
    SegmentFactory.getSegments(thisDocID)
    .then(segments => {
      segments.forEach(segment => {
        toCheck = segment.classes;
        // If it is an original segment, removes its class
        if (checkUndefined(toCheck) && toCheck.includes('deleted')) {
          promises.push(SegmentFactory.patchSegment(
            segment.firebaseID,
            {classes: null}
          ));
        } else if (checkUndefined(toCheck) && toCheck.includes('added')) {
          promises.push(
            SegmentFactory.deleteSegment(segment.firebaseID)
          );
        }
      });
      return Promise.all(promises);
    })
    .then(() => $location.path(`/docs/${thisTeamsID}`));
  };

// Allows user to keep doc in 'pending' without 'cancelling' or
// 'completing' the editing
  $scope.save = () => $window.location.href = `#!/docs/${thisTeamsID}`;

// Moves document from 'pending' to 'completed'
  $scope.completed = () => {
    $scope.doc.completed = true;
    $scope.doc.reviewer = loggedInUid;
    //Pass through segmentation
    DocFactory.putDoc($scope.doc)
    .then(() => $location.path(`docs/${thisTeamsID}`))
    .catch(err => console.log(err));
  };

  const createNewEditSuggestion = idx => {
    // Builds object for new text segment to be posted to database
    let newText = {
      classes: ["added"],
      doc_id: thisDocID,
      doc_order: $scope.segments[idx].doc_order + 1,
      text: document.getElementById($scope.segments[idx].firebaseID).innerHTML.trim()
    };

    // Posts newText segment to database
    SegmentFactory.postSegment(newText)
    .then(() => {
      let promises = [];

      // Updates the original segment with class 'deleted', pushing the
      // patch to a Promise.all array
      promises.push(SegmentFactory.patchSegment(
        $scope.segments[idx].firebaseID,
        {classes: ["deleted"]}
      ));

      // Updates the order of of each segment in the doc coming after the
      // original segment, pushing each patch to a Promise.all array
      for (let i = idx + 1; i < $scope.segments.length; i++) {
        promises.push(SegmentFactory.patchSegment(
          $scope.segments[i].firebaseID,
          {doc_order: $scope.segments[i].doc_order + 1}
        ));
      }

      return Promise.all(promises);
    })
    // Gets updated data and reprints to the DOM
    .then(() => SegmentFactory.getSegments(thisDocID))
    .then(segments => $scope.segments = segments)
    .catch(err => console.log(err));
  };

  const updateEditSuggestion = (id, idx) => {
    overwriteText = document.getElementById(id).innerHTML.trim();

    SegmentFactory.patchSegment(id, {text: overwriteText})
    .then(() => SegmentFactory.getSegments(thisDocID))
    .then(segments => $scope.segments = segments);
  };

  const overwriteEditSuggestion = (id, idx) => {
    let suggestionSegment = $scope.segments[idx + 1];
    overwriteText = document.getElementById(id).innerHTML.trim();

    SegmentFactory.patchSegment(suggestionSegment.firebaseID, {text: overwriteText})
    .then(() => SegmentFactory.getSegments(thisDocID))
    .then(segments => $scope.segments = segments);
  };

  $scope.diff = (id, originalText) => {
    let text = document.getElementById(id).innerHTML;

    // Checks if there was a change in the text
    if (text.trim() !== originalText.trim()) {
      // Finds the index of the old segment for referring to it throughout
      // the updating process
      let originalSegmentIdx = $scope.segments.findIndex(
        segment => segment.firebaseID === id
      );
      toCheck = $scope.segments[originalSegmentIdx].classes;
      // Passes when user changes text of a green highlighted 'added'
      // segment, updating the suggestion
      if (checkUndefined(toCheck) && toCheck.includes("added")) {
        updateEditSuggestion(id, originalSegmentIdx);

      // Passes when user changes text of a red highlight 'deleted'
      // segment, overwriting the previous edit suggestion
      } else if (checkUndefined(toCheck) && toCheck.includes("deleted")) {
        overwriteEditSuggestion(id, originalSegmentIdx);

      // Passes when a user changes text of an original, unmodified
      // segment, creating a new edit suggestion
      } else {
        createNewEditSuggestion(originalSegmentIdx);
      }
    }
  };

  DocFactory.getDoc(thisDocID)
  .then(doc => {
    $scope.doc = doc;
    // Get the doc owner's display name
    return UserFactory.getUser(doc.uid);
  })
  .then(userData => {
    $scope.doc.displayName = userData.displayName;
    // Get document segments
    return SegmentFactory.getSegments(thisDocID);
  })
  .then(segments => $scope.segments = segments)
  .catch(err => console.log(err));
});
