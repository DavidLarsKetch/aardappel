"use strict";

angular.module("DocApp").factory("TeamFactory", function($q, $http, FirebaseCredentials) {
  const attachFirebaseID = firebaseID =>
    $q((resolve, reject) =>
      $http.patch(`${FirebaseCredentials.databaseURL}/teams/${firebaseID}.json`, JSON.stringify({firebaseID}))
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const getTeams = () =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/teams.json`)
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const getTeam = id =>
    $q((resolve, reject) =>
      $http.get(`${FirebaseCredentials.databaseURL}/teams/${id}.json`)
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const patchTeam = (id, data) =>
    $q((resolve, reject) =>
      $http.patch(`${FirebaseCredentials.databaseURL}/teams/${id}.json`, JSON.stringify(data))
      .then(({data}) => resolve(data))
      .catch(err => reject(err))
    );

  const postTeam = postData =>
    $q((resolve, reject) =>
      $http.post(`${FirebaseCredentials.databaseURL}/teams.json`, JSON.stringify(postData))
      .then(({data}) => attachFirebaseID(data.name))
      .then(({firebaseID}) => resolve(firebaseID))
      .catch(err => reject(err))
    );

  return {getTeams, getTeam, patchTeam, postTeam};
});
