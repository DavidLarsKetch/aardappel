"use strict";

angular.module("DocApp").factory("AuthFactory", function($q, $http, FirebaseCredentials) {

  const isAuthenticated = () =>
    $q((resolve, reject) =>
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          // From copy-pasta - do I need it?
          // currentUser = user.uid;
          resolve(true);
        } else {
          resolve(false);
        }
      })
    );

  // Need a check for user's access to an editing team
  // Potentially, in app.js routes, check another isAuth() type function which
  // looks to editing team ids listed in a property in a user obj on Firebase

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
