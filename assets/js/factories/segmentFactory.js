"use strict";

angular.module("DocApp").factory("SegmentFactory", function($q, $http, FirebaseCredentials) {
  const segmentRegEx = new RegExp(/(\S.*?\w+[.?!]+)(?=\s+|$)/gm);

  const segmentText = text =>
    text
    .replace(/&nbsp;/, ' ') // Replaces &nbsp; HTML entity with space
    .match(segmentRegEx);

  const breakOutSegment = (segmentID, idx1, idx2) => {
    // TODO: Issue with breaking out segments. When a selection is made
    // & a comment exists in that sentence prior to the selection, then
    // the start & end are of by +1.
    let start = idx1 < idx2 ? idx1 : idx2;
    let end = idx1 > idx2 ? idx1 : idx2;
    let whole = document.getElementById(segmentID).innerHTML.trim();
    let segments = [];

    if (start === 0){
      segments.push(
        whole.substring(start, end),
        whole.substring(end)
      );
    } else if (end === whole.length) {
      segments.push(
        whole.substring(0, start),
        whole.substring(end)
      );
    } else {
      segments.push(
        whole.substring(0, start),
        whole.substring(start, end),
        whole.substring(end)
      );
    }
    return segments;
  };

  const formatData = segments => {
    let keys = Object.keys(segments);

    keys.forEach(key => {
      // Provides Firebase ID for use in DOM as ID
      segments[key].firebaseID = key;
      // If segment has classes, joins the array of classes into a string
      if (segments[key].classes)
        segments[key].classes = segments[key].classes.join(' ');
    });

    // Sorts segments using "doc_id" prop to ensure that they are in
    // order of appearance in the doc
    let sorted = _.sortBy(segments, "doc_order");

    return sorted;
  };

  const deleteSegment = id =>
    $q((resolve, reject) =>
      $http.delete(`${FirebaseCredentials.databaseURL}/segments/${id}.json`)
      .then(() => resolve())
      .catch(err => reject(err))
    );

  const getSegments = id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/segments.json?orderBy="doc_id"&equalTo="${id}"`)
      .then(({data}) => {
        let segments = formatData(data);
        resolve(segments);
      })
      .catch(err => console.log(err))
    );

  const patchSegment = (id, data) =>
    $q((resolve, reject) =>
      $http.patch(`${FirebaseCredentials.databaseURL}/segments/${id}.json`, JSON.stringify(data))
      .then(({data}) => resolve(data))
      .catch(err => console.log(err))
  );

  const postSegment = segment =>
    $q((resolve, reject) =>
      $http.post(`${FirebaseCredentials.databaseURL}/segments.json`, JSON.stringify(segment))
      .then(({data}) => resolve(data))
      .catch(err => console.log(err))
    );

  return {breakOutSegment, deleteSegment, getSegments, patchSegment, postSegment, segmentText};
});
