"use strict";

angular.module("DocApp").controller("ReviewNavBtnsCtrl", function(
  $scope, $q,
  BoolServices, NavServices,
  DocFactory, SegmentFactory
) {
  const loggedInUid = firebase.auth().currentUser.uid;
  const thisDocID = NavServices.go.getDocID();
  const thisTeamsID = NavServices.go.getTeamsID();

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
  
////// Allows cancelling of changes made
  $scope.cancel = () =>
    $q.all(tempSuggestions.delete())
    .then(() => NavServices.go.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));

////// Allows user to keep doc in 'pending' without 'cancelling' or
    // 'completing' the editing
  $scope.save = () =>
    $q.all(tempSuggestions.keep())
    .then(() => NavServices.go.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));

  // Moves document from 'pending' to 'completed'
  $scope.completed = () =>
    DocFactory.patchDoc(
      thisDocID,
      {
        completed: true,
        reviewer: loggedInUid
      }
    )
    .then(() => $q.all(tempSuggestions.keep()))
    .then(() => NavServices.go.toAllDocs(thisTeamsID))
    .catch(err => console.log(err));

  $scope.rereview = () => DocFactory.patchDoc(
    thisDocID,
    {
      completed: false,
      reviewer: null
    })
    .then(() => NavServices.go.toDocPending(thisTeamsID, thisDocID))
    .catch(err => console.log(err));

  $scope.toAllDocs = () => NavServices.go.toAllDocs(thisTeamsID);
});
