"use strict";

angular.module("DocApp").controller("ReviewCtrl", function($scope, $document, $location, $routeParams, $window, CommentFactory, DocFactory, SegmentFactory, TeamFactory, UserFactory) {

  const loggedInUid = firebase.auth().currentUser.uid;
  const thisDocID = $routeParams.doc_id;
  const thisTeamsID = $routeParams.team_id;
  $scope.reviewItem = {};
  let loggedInDisplayName, overwriteText, toCheck, updatedText;

////// INTERNAL FUNCTIONS

////// Checks whether passed in property is not undefined
  const checkUndefined = prop => typeof prop !== "undefined";

////// Checks whether segment has uid_temp & whether the temp
    // edit is the current user's
  const checkUidTemp = ({uid_temp}) =>
    checkUndefined(uid_temp) && uid_temp === loggedInUid;

////// Removes temporary edits from the database; passing in 'true' means to
    // reset segments to their unedited status, passing in 'false' means to
    // remove the temporary status of suggested edits
  const removeTemporary = bool =>
    SegmentFactory.getSegments(thisDocID)
    .then(segments => {
      let promises = [];

      if (bool) {
        promises.concat(segments.filter(segment =>
          checkUidTemp(segment) && segment.classes.includes("deleted")
        ).map(segment =>
          SegmentFactory.patchSegment(
            segment.firebaseID, {classes: null, uid_temp: null}
          )
        ));

        promises.concat(segments.filter(segment =>
          checkUidTemp(segment) && segment.classes.includes("added")
        ).map(segment =>
          SegmentFactory.deleteSegment(segment.firebaseID)
        ));

      } else if (!bool) {
        promises.concat(segments.filter(segment =>
          checkUidTemp(segment)
        ).map(segment =>
          SegmentFactory.patchSegment(segment.firebaseID, {uid_temp: null})
        ));
      }

      return Promise.all(promises);
    });

////// Creates new edit suggestion, updating old segment with 'deleted', posting
    // posting new segment, & updating doc_order of succeeding segments
  const createNewEditSuggestion = idx => {
    // Gets text of the suggested edit
    let text =
      document.getElementById($scope.segments[idx].firebaseID)
      .innerHTML.trim();
    // Segments text in order to break apart sentences in the suggested
    // edit
    let segments = SegmentFactory.segmentText(text);

    // Builds object for new text segment to be posted to database while
    // posting it to database
    let promises = segments.map((segment, index) =>
      SegmentFactory.postSegment({
        classes: ["added"],
        doc_id: thisDocID,
        doc_order: $scope.segments[idx].doc_order + 1 + index,
        text: segment,
        uid_temp: loggedInUid
      })
    );

    Promise.all(promises)
    .then(() => {
      let promises = [];
    // Updates the original segment with class 'deleted', pushing the
    // patch to a Promise.all array
      promises.push(SegmentFactory.patchSegment(
        $scope.segments[idx].firebaseID,
        {
          classes: ["deleted"],
          uid_temp: loggedInUid
        }
      ));

    // Updates the order of each segment in the doc coming after the
    // original segment, pushing each patch to a Promise.all array
      for (let i = idx + 1; i < $scope.segments.length; i++) {
        promises.push(SegmentFactory.patchSegment(
          $scope.segments[i].firebaseID,
          {doc_order: $scope.segments[i].doc_order + segments.length}
        ));
      }

      return Promise.all(promises);
    })
    // Gets updated data and reprints to the DOM
    .then(() => SegmentFactory.getSegments(thisDocID))
    .then(segments => $scope.segments = segments)
    .catch(err => console.log(err));
  };

  const updateEditSuggestion = (id, optionalID) => {
    updatedText =
    optionalID ? document.getElementById(optionalID).innerHTML.trim() : document.getElementById(id).innerHTML.trim();

    SegmentFactory.patchSegment(id, {text: updatedText})
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

////// PARTIAL-FACING FUNCTIONS

////// Allows cancelling of changes made
  $scope.cancel = () => {
    removeTemporary(true)
    .then(() => $location.path(`/docs/${thisTeamsID}`))
    .catch(err => console.log(err));
  };

////// Allows user to keep doc in 'pending' without 'cancelling' or
    // 'completing' the editing
  $scope.save = () =>
    removeTemporary(false)
    .then(() => $window.location.href = `#!/docs/${thisTeamsID}`)
    .catch(err => console.log(err));

  // Moves document from 'pending' to 'completed'
  $scope.completed = () => {
    $scope.doc.completed = true;
    $scope.doc.reviewer = loggedInUid;

    DocFactory.putDoc($scope.doc)
    .then(() => removeTemporary(false))
    .then(() => $location.path(`docs/${thisTeamsID}`))
    .catch(err => console.log(err));
  };

////// Changes doc 'completed' status to false, redirects to
    // `review-pending` view
  $scope.rereview = () => {
    $scope.doc.completed = false;
    $scope.doc.reviewer = null;

    DocFactory.putDoc($scope.doc)
    .then(() => $location.path(`docs/${thisTeamsID}/pending/${thisDocID}`))
    .catch(err => console.log(err));
  };

////// Functions for (1) updating edit suggestions, (2) overwriting
    // edit suggestions & (3) creating edit suggestions. After any
    // one of these is successful, closes the reviewBox.
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
        updateEditSuggestion(id);

    // Passes when user changes text of a red highlight 'deleted'
    // segment, overwriting the previous edit suggestion
      } else if (checkUndefined(toCheck) && toCheck.includes("deleted")) {
        overwriteEditSuggestion(id, originalSegmentIdx);

    // Passes when a user changes text of an original, unmodified
    // segment, creating a new edit suggestion
      } else {
        createNewEditSuggestion(originalSegmentIdx);
      }
      $scope.showWrapper = false;
    }
  };


////// Toggles showing the reviewBox with the review item & its classes
  $scope.activateReviewBox = segment => {

    // Passes if clicked on segment is "commented"
    if (checkUndefined(segment.classes) && segment.classes.includes("commented")) {
    // Gets the comment from the database
      CommentFactory.getComment(segment.firebaseID)
      .then(comment => {
    // Toggles showing the reviewBox wrapper
        $scope.showWrapper =
          $scope.showWrapper && $scope.reviewItem.text === comment.text ? false : true;

    // Gives reviewBox comment's classes
        document.getElementById("reviewBox").classList = `${segment.classes} inline-comment-box`;

    // Assigns comment to reviewItem for printing & manipulating
        $scope.reviewItem = comment;

    // Gets displayName from commenter's uid
        return UserFactory.getUser(comment.uid);
      })
      .then(({displayName}) =>
        $scope.reviewItem.displayName = `- ${displayName}`
      )
      .catch(err => console.log(err));
    // Passes if the clicked on segment is "added" or "deleted"
    } else if (checkUndefined(segment.classes) && !segment.classes.includes("commented")) {
      $scope.showWrapper =
        $scope.showWrapper && $scope.reviewItem.text === segment.text ? false : true;

      document.getElementById("reviewBox").classList = `${segment.classes} inline-comment-box`;

      $scope.reviewItem = segment;
    }
  };

////// Updates review with new review text (& uid if comment) if user
    // changes that text
  $scope.updateReview = () => {
    let classCheck = [...document.getElementById("reviewBox").classList];

    let newReviewText =
      document.getElementById("updatedReviewText").innerHTML;

    if ($scope.reviewItem.text !== newReviewText && classCheck.includes("commented")) {
      // Patches with new comment text & uid, does not check for uid since
      // that would be extraneous
      CommentFactory.patchComment(
        $scope.reviewItem.firebaseID,
        {text: newReviewText, uid: loggedInUid}
      )
      .then(comment => {
        $scope.reviewItem = comment;
        return UserFactory.getUser(comment.uid);
      })
      .then(({displayName}) => $scope.reviewItem.displayName = displayName)
      .catch(err => console.log(err));

    } else if ($scope.reviewItem.text !== newReviewText && classCheck.includes("deleted")) {

      let idx =
        $scope.segments.findIndex(segment => $scope.reviewItem.firebaseID === segment.firebaseID);

      overwriteEditSuggestion("updatedReviewText", idx);

      $scope.reviewItem.text = newReviewText;

    } else if ($scope.reviewItem.text !== newReviewText && classCheck.includes("added")) {

      updateEditSuggestion($scope.reviewItem.firebaseID, "updatedReviewText");
      $scope.reviewItem.text = newReviewText;
    }
  };

////// ON-PAGE LOAD FUNCTIONS

////// Verifies user has access to team, redirects to team-login if not
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

////// Gets the doc, doc owner's displayName, & doc's segments
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
