"use strict";

angular.module("DocApp").factory("UserFactory", function($q, $http, FirebaseCredentials) {
  // For drilling down past Firebase ID as key for the obj
  const grabFirebaseID = data => Object.keys(data);
  
  // Firebase Authentication saves user data, but need separate obj for
  // custom properties used in app
  const registerDisplayName = data =>
    $q((resolve, reject) =>
      $http.post(`${FirebaseCredentials.databaseURL}/users.json`, JSON.stringify(data))
      .then(resp => resolve(resp))
      .catch(err => reject(err))
    );

    const getUser = uid =>
      $q((resolve, reject) =>
        $http.get(`${FirebaseCredentials.databaseURL}/users.json?orderBy="uid"&equalTo="${uid}"`)
        .then(({data}) => resolve(data[grabFirebaseID(data)]))
        .catch(err => reject(err))
      );

  return {getUser, registerDisplayName};
});
