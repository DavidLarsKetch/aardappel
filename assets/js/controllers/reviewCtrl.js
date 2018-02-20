"use strict";

angular.module("DocApp").controller("ReviewCtrl",
function(
  $scope, $compile, $q,
  BoolServices, InterfaceServices, NavServices,
  CommentFactory, DocFactory, SegmentFactory, TeamFactory, UserFactory
) {

  const loggedInUid = firebase.auth().currentUser.uid;
  const thisDocID = NavServices.getDocID();
  const thisTeamsID = NavServices.getTeamsID();
  $scope.reviewItem = {};

////// INTERNAL FUNCTIONS
///// Reprints doc's latest segments in Firebase
  const reprint = () =>
    SegmentFactory.getSegments(thisDocID)
    .then(segments => $scope.segments = segments)
    .catch(err => console.log(err));

////// Removes or saves temporary edit suggestions
  const tempSuggestions = {
    // Removes temporary edit suggestions made by the current user in the
    // current session
    delete: segments => {
      return SegmentFactory.getSegments(thisDocID)
      .then(segments => {
        let promises = segments
    // Finds segments that were marked for deletion
        .filter(({classes, temp_uid}) =>
          BoolServices.isUidTemp(temp_uid, loggedInUid) && BoolServices.hasClass(classes, "deleted")
        )
    // Removes "classes" & "temp_uid" from that segment
        .map(({firebaseID}) =>
          SegmentFactory.patchSegment(
            firebaseID, {classes: null, temp_uid: null}
          )
        );
    // Finds segments that were marked for addition
        promises.concat(segments
          .filter(({classes, temp_uid}) =>
            BoolServices.isUidTemp(temp_uid, loggedInUid) && BoolServices.hasClass(classes, "added")
          )
    // Deletes those segments
          .map(({firebaseID}) =>
            SegmentFactory.deleteSegment(firebaseID)
          )
        );
        return $q.all(promises);
      })
    // Retrieves the state of the doc
      .then(() => SegmentFactory.getSegments(thisDocID))
    // Updates the "doc_order" of the segments according to their final
    // place in the doc
      .then(segments => {
        let promises = segments.map((segment, index) =>
          SegmentFactory.patchSegment(
            segment.firebaseID, {doc_order: index}
          )
        );
        return $q.all(promises);
      });
    },
    // Makes edit suggestions permanent for edits made by the current user
    keep: segments =>
      SegmentFactory.getSegments(thisDocID)
      .then(segments => segments
        .filter(({temp_uid}) =>
          BoolServices.isUidTemp(temp_uid, loggedInUid)
        )
    // Removes "temp_uid", making it a permanent suggestion
        .map(({firebaseID}) => SegmentFactory.patchSegment(
          firebaseID, {temp_uid: null}
        ))
      )
  };

////// Provides functions for updating the doc with suggested additions,
    // deletions and edits
  const updater = {
    adds: (toAdd, originalText, idx) => {
      let arrayIdx = toAdd.indexOf(originalText);
    // Posts new text segment(s) added, calculating their doc_order based
    // on the original segment's doc_order + that segment's index in the
    // array of segments
      let promises = toAdd.map((segment, index) => {
        if (arrayIdx !== index)
          SegmentFactory.postSegment({
            classes: ["added"],
            doc_id: thisDocID,
            doc_order: $scope.segments[idx].doc_order + index,
            text: segment,
            temp_uid: loggedInUid
          });
      });
    // If the original segment is not the first segment in the array of
    // segments, then adds to that segment's doc_order its place in the
    // array of segments
      if (arrayIdx !== 0)
        promises.push(SegmentFactory.patchSegment(
          $scope.segments[idx].firebaseID,
          {doc_order: $scope.segments[idx].doc_order + arrayIdx}
        ));

    // Updates each succeeding segment in the doc with its new doc_order
      for (let i = idx + 1; i < $scope.segments.length; i++) {
        promises.push(SegmentFactory.patchSegment(
          $scope.segments[i].firebaseID,
          {doc_order: $scope.segments[i].doc_order + toAdd.length - 1}
        ));
      }

      $q.all(promises)
      .then(() => reprint());
    },
    // Marks text segment for deletion with "deleted" class
    deletes: toDelete =>
      SegmentFactory.patchSegment(
        toDelete, {classes: ["deleted"], temp_uid: loggedInUid}
      ).then(() => reprint()),

    edits: (toEdit, idx) => {
    // Builds object for new text segment to be posted to database while
    // posting it to database
      let promises = toEdit.map((segment, index) =>
        SegmentFactory.postSegment({
          classes: ["added"],
          doc_id: thisDocID,
          doc_order: $scope.segments[idx].doc_order + 1 + index,
          text: segment,
          temp_uid: loggedInUid
        })
      );

    // Updates the original segment with class 'deleted', pushing the
    // patch to a Promise.all array
      promises.push(SegmentFactory.patchSegment(
        $scope.segments[idx].firebaseID,
        {classes: ["deleted"], temp_uid: loggedInUid}
      ));

    // Updates the order of each segment in the doc coming after the
    // original segment, pushing each patch to a Promise.all array
      for (let i = idx + 1; i < $scope.segments.length; i++) {
        promises.push(SegmentFactory.patchSegment(
          $scope.segments[i].firebaseID,
          {doc_order: $scope.segments[i].doc_order + toEdit.length}
        ));
      }

      $q.all(promises)
    // Gets updated data and reprints to the DOM
      .then(() => reprint());
    }
  };

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

    if (BoolServices.hasClass(suggestionSegment.classes, "added")) {
      SegmentFactory.patchSegment(suggestionSegment.firebaseID, {text: overwriteText})
      .then(() => reprint());
    } else {
      createNewEditSuggestion(idx);
    }
  };

////// PARTIAL-FACING FUNCTIONS

////// Allows cancelling of changes made
  $scope.cancel = () =>
    $q.all(tempSuggestions.delete())
    .then(() => NavServices.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));

////// Allows user to keep doc in 'pending' without 'cancelling' or
    // 'completing' the editing
  $scope.save = () =>
    $q.all(tempSuggestions.keep())
    .then(() => NavServices.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));

  // Moves document from 'pending' to 'completed'
  $scope.completed = () => {
    $scope.doc.completed = true;
    $scope.doc.reviewer = loggedInUid;

    DocFactory.putDoc($scope.doc)
    .then(() => $q.all(tempSuggestions.keep()))
    .then(() => NavServices.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));
  };

////// Changes doc 'completed' status to false, redirects to
    // `review-pending` view
  $scope.rereview = () => {
    $scope.doc.completed = false;
    $scope.doc.reviewer = null;

    DocFactory.putDoc($scope.doc)
    .then(() => NavServices.toDocPending(thisTeamsID, thisDocID))
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
        selParentID, sel.baseOffset, sel.extentOffset
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

    // Sets current index for comment navigate buttons
        InterfaceServices.setIndex(segment.firebaseID);

    // Gets displayName from commenter's uid
        return UserFactory.getUser(comment.uid);
      })
      .then(({displayName}) =>
        $scope.reviewItem.displayName = `- ${displayName}`
      )
      .catch(err => console.log(err));
    // Passes if the clicked on segment is "added" or "deleted"
    // TODO: With new UI, decide whether this functionality is desirable
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

  $scope.toAllDocs = () => NavServices.toAllDocs(thisTeamsID);

////// ON-PAGE LOAD FUNCTIONS

////// Verifies user has access to team, redirects to team-login if not
  TeamFactory.verifyUserAccess(thisTeamsID, loggedInUid)
    // Gets the team's display name
  .then(({displayName}) => $scope.teamName = displayName)
  .catch(() => NavServices.toTeamsLogin());

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
