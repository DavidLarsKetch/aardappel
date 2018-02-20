"use strict";

angular.module("DocApp").controller("ReviewCtrl", function($scope, $document, $location, $routeParams, $q, $window, BoolServices, CommentFactory, DocFactory, InterfaceServices, SegmentFactory, TeamFactory, UserFactory) {

  const loggedInUid = firebase.auth().currentUser.uid;
  const thisDocID = $routeParams.doc_id;
  const thisTeamsID = $routeParams.team_id;
  $scope.reviewItem = {};

////// INTERNAL FUNCTIONS
  const reprint = () =>
    SegmentFactory.getSegments(thisDocID)
    .then(segments => $scope.segments = segments)
    .catch(err => console.log(err));

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

      return $q.all(promises);
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

    $q.all(promises)
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

      return $q.all(promises);
    })
    // Gets updated data and reprints to the DOM
    .then(() => SegmentFactory.getSegments(thisDocID))
    .then(segments => $scope.segments = segments)
    .catch(err => console.log(err));
////// Creates new edit suggestion, updating old segment with 'deleted', posting
    // posting new segment, & updating doc_order of succeeding segments
  const createNewEditSuggestion = idx => {
    let IDofOriginal = $scope.segments[idx].firebaseID;
    let textOfOriginal = $scope.segments[idx].text;
    // Gets text of the suggested edit
    let text =
      document.getElementById(IDofOriginal)
      .innerHTML.trim();
    // Segments text in order to break apart sentences in the suggested
    // edit
    let segments = SegmentFactory.segmentText(text);
    if (!segments) {
      updater.deletes(IDofOriginal);
    } else if (segments.includes(textOfOriginal)) {
      updater.adds(segments, textOfOriginal, idx);
    } else {
      updater.edits(segments, idx);
    }
  };

  const updateEditSuggestion = (id, optionalID) => {
    let updatedText =
    optionalID ? document.getElementById(optionalID).innerHTML.trim() : document.getElementById(id).innerHTML.trim();

    SegmentFactory.patchSegment(id, {text: updatedText})
    .then(() => reprint());
  };

  const overwriteEditSuggestion = (id, idx) => {
    let suggestionSegment = $scope.segments[idx + 1],
    overwriteText = document.getElementById(id).innerHTML.trim();

    SegmentFactory.patchSegment(suggestionSegment.firebaseID, {text: overwriteText})
    .then(() => reprint());
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
      let toCheck = $scope.segments[originalSegmentIdx].classes;
    // Passes when user changes text of a green highlighted 'added'
    // segment, updating the suggestion
      if (BoolServices.hasClass(toCheck, "added")) {
        updateEditSuggestion(id);

    // Passes when user changes text of a red highlight 'deleted'
    // segment, overwriting the previous edit suggestion
  } else if (BoolServices.hasClass(toCheck, "deleted")) {
        overwriteEditSuggestion(id, originalSegmentIdx);

    // Passes when a user changes text of an original, unmodified
    // segment, creating a new edit suggestion
      } else {
        createNewEditSuggestion(originalSegmentIdx);
      }
      $scope.showWrapper = false;
    }
  };

////// Toggles displaying the commentBox where comments are inserted
  $scope.toggleCommentBox = () => {
    $scope.commentActive = $scope.commentActive ? false : true;
    document.getElementById("newCommentBox").innerHTML = '';
  };

////// Saves comments to database. (1) Constructs necessary pieces for
    // updating, (2) deletes old segment being commented upon, (3)
    // splits segment into parts, (4) assigns remaining properties,
    // retaining classes subject to conditions, (5) posts new segments,
    // (6) updates segments succeeding new ones with their up-to-date
    // doc_order
  $scope.saveComment = () => {
    // (1)
    let promises = [];
    let comment = {
      uid: loggedInUid,
      segment_id: null,
      text: document.getElementById("newCommentBox").innerHTML.trim(),
    };
    let sel = document.getSelection();
    let selParentID = sel.focusNode.parentElement.id;

    let originalSegmentIdx = $scope.segments.findIndex(
      segment => segment.firebaseID === selParentID
    );

    // (2) deletes old segment from DB
    SegmentFactory.deleteSegment(selParentID)
    .then(() => {
      let toCheck = $scope.segments[originalSegmentIdx];
    // (3) Breaks apart segments based upon the selected div
      let newSegments = SegmentFactory.breakOutSegment(
        selParentID, sel.baseOffset, sel.focusOffset
      );
      newSegments = newSegments.map((segment, index) => {return {
        doc_id: thisDocID,
        doc_order: originalSegmentIdx + index,
        text: segment
      };});

    // A = original segment has classes
    // B = string is the one being commented upon
    promises = newSegments     // !A && !B
      .filter(({text}) =>
        text !== sel.toString() && !toCheck.hasOwnProperty("classes")
      )
      .map(segment => SegmentFactory.postSegment(segment));

    promises = newSegments      // A && B
      .filter(({text}) =>
        toCheck.hasOwnProperty("classes") && text === sel.toString()
      )
      .map(segment => {
        segment.classes = toCheck.classes.split(' ');
        segment.classes.push("commented");
        return SegmentFactory.postSegment(segment)
        .then(({name}) => {
          comment.segment_id = name;
          return CommentFactory.postComment(comment);
        });
      });

    promises = newSegments      // A && !B
      .filter(({text}) =>
        toCheck.hasOwnProperty("classes") && text !== sel.toString()
      )
      .map(segment => {
        segment.classes = toCheck.classes.split(' ');
        return SegmentFactory.postSegment(segment);
      });

    promises = newSegments     // !A && B
      .filter(({text}) =>
        !toCheck.hasOwnProperty("classes") && text === sel.toString()
      )
      .map(segment => {
        segment.classes = ["commented"];
        return SegmentFactory.postSegment(segment)
        .then(({name}) => {
          comment.segment_id = name;
          return CommentFactory.postComment(comment);
        });
      });

      for (let i = originalSegmentIdx + 1; i < $scope.segments.length; i++) {
        promises.push(SegmentFactory.patchSegment(
          $scope.segments[i].firebaseID,
          {doc_order: $scope.segments[i].doc_order - 1 + newSegments.length}
        ));
      }

      return $q.all(promises);
    })
    // Reprints segments after getting them
    .then(() => SegmentFactory.getSegments(thisDocID))
    .then(segments => {
      $scope.segments = segments;
    // Clears & closes comment box
      document.getElementById("newCommentBox").innerHTML = '';
      $scope.showNewCommentBox = false;
    })
    .catch(err => console.log(err));
  };

////// Toggles showing the reviewBox with the review item & its classes
  $scope.activateReviewBox = segment => {

    // Passes if clicked on segment is "commented"
    if (BoolServices.hasClass(segment.classes, "commented")) {
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

    // For 'next comment' & 'prev comment' buttons, sets starting point
    // index
      InterfaceServices.setIndex(segment.firebaseID);

    // Gets displayName from commenter's uid
        return UserFactory.getUser(comment.uid);
      })
      .then(({displayName}) =>
        $scope.reviewItem.displayName = `- ${displayName}`
      )
      .catch(err => console.log(err));
    // Passes if the clicked on segment is "added" or "deleted"
  } else if (BoolServices.notUndefined(segment.classes) && !BoolServices.hasClass(segment.classes, "commented")) {
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

    if ($scope.reviewItem.text !== newReviewText && BoolServices.hasClass(classCheck, "commented")) {
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

    } else if ($scope.reviewItem.text !== newReviewText && BoolServices.hasClass(classCheck, "deleted")) {

      let idx =
        $scope.segments.findIndex(segment => $scope.reviewItem.firebaseID === segment.firebaseID);

      overwriteEditSuggestion("updatedReviewText", idx);

      $scope.reviewItem.text = newReviewText;

    } else if ($scope.reviewItem.text !== newReviewText && BoolServices.hasClass(classCheck, "added")) {

      updateEditSuggestion($scope.reviewItem.firebaseID, "updatedReviewText");
      $scope.reviewItem.text = newReviewText;
    }
  };

  $scope.nextComment = () => {
    InterfaceServices.next();
    let segment = InterfaceServices.findSegment($scope.segments);
    $scope.activateReviewBox(segment);
  };

  $scope.prevComment = () => {
    InterfaceServices.prev();
    let segment = InterfaceServices.findSegment($scope.segments);
    $scope.activateReviewBox(segment);
  };

////// ON-PAGE LOAD FUNCTIONS

////// Verifies user has access to team, redirects to team-login if not
  TeamFactory.verifyUserAccess(thisTeamsID, loggedInUid)
    // Gets the team's display name
  .then(({displayName}) => $scope.teamName = displayName)
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
    return reprint();
  });
});
