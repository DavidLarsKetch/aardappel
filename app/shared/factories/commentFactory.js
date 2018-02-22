"use strict";

angular.module("DocApp").factory("CommentFactory", function($q, $http, FirebaseCredentials) {

  const deleteComment = comment_id =>
    $q((resolve, reject) =>
      $http.delete(`${FirebaseCredentials.databaseURL}/comments/${comment_id}.json`)
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const getComment = segment_id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/comments.json?orderBy="segment_id"&equalTo="${segment_id}"`)
      .then(({data}) => {
        // Attaches Firebase ID as a property for patching
        let firebaseID = Object.keys(data)[0];
        data[firebaseID].firebaseID = firebaseID;
        resolve(data[firebaseID]);
      })
      .catch(err => reject(err))
    );

  const patchComment = (id, data) =>
    $q((resolve, reject) =>
      $http.patch(`${FirebaseCredentials.databaseURL}/comments/${id}.json`, JSON.stringify(data))
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const postComment = data =>
    $q((resolve, reject) =>
      $http.post(`${FirebaseCredentials.databaseURL}/comments.json`, JSON.stringify(data))
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  return {deleteComment, getComment, patchComment, postComment};
});
