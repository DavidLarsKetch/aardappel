"use strict";

angular.module("DocApp").controller("ReviewCtrl",
function(
  $scope, $compile, $q,
  BoolServices, InterfaceServices, NavServices,
  CommentFactory, DocFactory, SegmentFactory, TeamFactory, UserFactory
) {

  const loggedInUid = firebase.auth().currentUser.uid;
  const thisDocID = NavServices.go.getDocID();
  const thisTeamsID = NavServices.go.getTeamsID();
  $scope.reviewItem = {};
  let commentInView = false,
  sel = {};

////// INTERNAL FUNCTIONS
///// Reprints doc's latest segments in Firebase
  const reprint = () =>
    SegmentFactory.getSegments(thisDocID)
    .then(segments => $scope.segments = segments)
    .catch(err => console.log(err));

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

    if (document.getSelection().toString() && $scope.commentActive) {
      sel = {
        baseOffset: document.getSelection().baseOffset,
        extentOffset: document.getSelection().extentOffset,
        parentID: document.getSelection().extentNode.parentElement.id,
        text: document.getSelection().toString()
      };
    } else {
      sel = {};
    }
  };

////// Saves comments to database.
  $scope.saveComment = () => {
    let promises = [];
    let comment = {
      uid: loggedInUid,
      segment_id: null,
      text: document.getElementById("newCommentBox").innerHTML.trim(),
    };
    if (!BoolServices.notUndefined(sel.text)) {
      sel = {
        baseOffset: document.getSelection().baseOffset,
        extentOffset: document.getSelection().extentOffset,
        parentID: document.getSelection().extentNode.parentElement.id,
        text: document.getSelection().toString()
      };
    }

    let originalSegmentIdx = $scope.segments.findIndex(
      segment => segment.firebaseID === sel.parentID
    );

    // Deletes old segment from DB
    SegmentFactory.deleteSegment(sel.parentID)
    .then(() => {
      let toCheck = $scope.segments[originalSegmentIdx];
    // Breaks apart segments based upon the selected div
      let newSegments = SegmentFactory.breakOutSegment(
        sel.parentID, sel.baseOffset, sel.extentOffset
      );
      newSegments = newSegments.map((segment, index) => {return {
        doc_id: thisDocID,
        doc_order: originalSegmentIdx + index,
        text: segment
      };});
    // Builds array of promises against these value of:
    // A = original segment has classes
    // B = string is the one being commented upon
    promises = newSegments     // !A && !B
      .filter(({text}) =>
        text !== sel.text && !toCheck.hasOwnProperty("classes")
      )
      .map(segment => SegmentFactory.postSegment(segment));

    promises = newSegments      // A && B
      .filter(({text}) =>
        toCheck.hasOwnProperty("classes") && text === sel.text
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
        toCheck.hasOwnProperty("classes") && text !== sel.text
      )
      .map(segment => {
        segment.classes = toCheck.classes.split(' ');
        return SegmentFactory.postSegment(segment);
      });

    promises = newSegments     // !A && B
      .filter(({text}) =>
        !toCheck.hasOwnProperty("classes") && text === sel.text
      )
      .map(segment => {
        segment.classes = ["commented"];
        return SegmentFactory.postSegment(segment)
        .then(({name}) => {
          comment.segment_id = name;
          return CommentFactory.postComment(comment);
        });
      });
    // Updates the doc_order of each succeeding segment
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
      $scope.toggleCommentBox();
      sel = {};
    })
    .catch(err => console.log(err));
  };

  $scope.toggleReviewBox = segment => {
    if (BoolServices.hasClass(segment.classes, "commented")) {
      angular.element(document.getElementById("reviewBox")).remove();

      CommentFactory.getComment(segment.firebaseID)
      .then(comment => {
        commentInView =
        commentInView && $scope.reviewItem.text === comment.text ? false : true;

      // Assigns comment to reviewItem for printing & manipulating
        $scope.reviewItem = comment;
      // Gets displayName from commenter's uid
        return UserFactory.getUser(comment.uid);
      })
      .then(({displayName}) => {
        $scope.reviewItem.displayName = `- ${displayName}`;

        if (commentInView) {
        // Wraps targeted 'commented' segment for jqLite functionality.
          let targetCommentElm = angular.element(document.getElementById(segment.firebaseID));

        // Grabs, compiles, & inserts review box div living
        // in InterfaceServices after commented segment
          let commentDiv = InterfaceServices.constructReviewBox();
          targetCommentElm.after($compile(commentDiv)($scope));

        // Sets current index for comment navigate buttons
          InterfaceServices.setIndex(segment.firebaseID);

        }
      })
      .catch(err => console.log(err));
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
    $scope.toggleReviewBox(segment);
  };

  $scope.prevComment = () => {
    InterfaceServices.prev();
    let segment = InterfaceServices.findSegment($scope.segments);
    $scope.toggleReviewBox(segment);
  };

  $scope.toAllDocs = () => NavServices.go.toAllDocs(thisTeamsID);

////// ON-PAGE LOAD FUNCTIONS

////// Verifies user has access to team, redirects to team-login if not
  TeamFactory.verifyUserAccess(thisTeamsID, loggedInUid)
    // Gets the team's display name
  .then(({displayName}) => $scope.teamName = displayName)
  .catch(() => NavServices.go.toTeamsLogin());

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
