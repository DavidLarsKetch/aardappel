"use strict";

angular.module("DocApp").factory("SegmentFactory", function($q, $http, FirebaseCredentials) {
  const deleteSegment = id =>
    $q((resolve, reject) =>
      $http.delete(`${FirebaseCredentials}/segments/${id}.json`)
      .then(() => resolve())
      .reject(err => reject(err))
    );

  const getSegments = id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials}/segments.json?orderBy="doc_id"&equalTo="${id}"`)
      .then(({data}) => resolve(data))
      .reject(err => console.log(err))
    );

  return {deleteSegment, getSegments};
});
