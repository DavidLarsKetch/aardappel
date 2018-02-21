"use strict";

angular.module("DocApp").factory("DocFactory", function($q, $http, FirebaseCredentials) {
  const attachFirebaseID = firebaseID =>
    $q((resolve, reject) =>
      $http.patch(`${FirebaseCredentials.databaseURL}/docs/${firebaseID}.json`, JSON.stringify({firebaseID}))
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const deleteDoc = id =>
    $q((resolve, reject) =>
      $http.delete(`${FirebaseCredentials.databaseURL}/docs/${id}.json`)
      .then(() => resolve())
      .catch(err => reject(err))
    );

  const getDoc = id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/docs/${id}.json`)
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const getDocs = id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/docs.json?orderBy="team_id"&equalTo="${id}"`)
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );
    
  const patchDoc = (id, data) =>
    $q((resolve, reject) =>
      $http.patch(`${FirebaseCredentials.databaseURL}/docs/${id}.json`, JSON.stringify(data))
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const postDoc = data =>
    $q((resolve, reject) =>
      $http.post(`${FirebaseCredentials.databaseURL}/docs.json`, JSON.stringify(data))
      .then(({data}) => attachFirebaseID(data.name))
      .then(({firebaseID}) => resolve(firebaseID))
      .catch(err => reject(err))
    );

  return {deleteDoc, getDoc, getDocs, patchDoc, postDoc};
});
