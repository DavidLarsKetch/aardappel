"use strict";

angular.module("DocApp").factory("UserFactory", function($q, $http, FirebaseCredentials) {

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
  // Object.values(data)[0] drills down past FirebaseID & returns the
  // single element in that array, the user object
        .then(({data}) => resolve(Object.values(data)[0]))
        .catch(err => reject(err))
      );

  return {getUser, registerDisplayName};
});
