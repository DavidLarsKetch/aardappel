"use strict";

angular.module("DocApp").factory("SegmentFactory", function($q, $http, FirebaseCredentials) {
  const segmentRegEx = new RegExp(/(\S.*?\w+[.?!]+)(?=\s+|$)/gm);

  const segmentText = text =>
    text
    .replace(/&nbsp;/, ' ') // Replaces &nbsp; HTML entity with space
    .match(segmentRegEx);

  const breakOutSegment = (segmentID, idx, range) => {
    let whole = document.getElementById(segmentID).innerHTML.trim();
    let segments = [];
    // TODO: REFACTOR
    if (idx === 0){
      segments.push(
        whole.substring(idx, range),
        whole.substring(range)
      );
    } else if (range === whole.length) {
      segments.push(
        whole.substring(0, idx),
        whole.substring(idx)
      );
    } else {
      segments.push(
        whole.substring(0, idx),
        whole.substring(idx, range),
        whole.substring(range)
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
