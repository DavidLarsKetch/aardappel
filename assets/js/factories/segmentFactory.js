"use strict";

angular.module("DocApp").factory("SegmentFactory", function($q, $http, FirebaseCredentials) {
  const deleteSegment = id =>
    $q((resolve, reject) =>
      $http.delete(`${FirebaseCredentials.databaseURL}/segments/${id}.json`)
      .then(() => resolve())
      .catch(err => reject(err))
    );

  const getSegments = id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/segments.json?orderBy="doc_id"&equalTo="${id}"`)
      .then(({data}) => resolve(data))
      .catch(err => console.log(err))
    );
    );

  return {deleteSegment, getSegments};
});
