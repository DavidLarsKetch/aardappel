"use strict";

angular.module("DocApp").factory("UserFactory", function($q, $http, FirebaseCredentials) {
  const registerDisplayName = data =>
    $q((resolve, reject) =>
      $http.post(`${FirebaseCredentials.databaseURL}/users.json`, JSON.stringify(data))
      .then(resp => resolve(resp))
      .catch(err => reject(err))
    );

  return {registerDisplayName};
});
