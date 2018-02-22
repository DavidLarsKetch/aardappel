"use strict";

angular.module("DocApp").factory("AuthFactory", function($q, $http, FirebaseCredentials) {

  const isAuthenticated = () =>
    $q((resolve, reject) =>
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
    );

  const login = ({email, password}) =>
    firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(({code, message}) => {return {code, message};});

  const logout = () =>
    firebase.auth().signOut();

  const registerEmail = ({email, password}) =>
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .catch(({code, message}) => {return {code, message};});

  return {login, logout, registerEmail, isAuthenticated};
});
