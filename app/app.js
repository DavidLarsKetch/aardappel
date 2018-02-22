"use strict";

const isAuth = ($window, AuthFactory) =>
  new Promise((resolve, reject) =>
    AuthFactory.isAuthenticated()
    .then(bool => {
      if (bool) {
        resolve();
      } else {
        $window.location.href = '#!/login';
        reject();
      }
    })
  );

angular.module("DocApp", ["ngRoute"])
.config($routeProvider =>
  $routeProvider
  .when('/login', {
    templateUrl: "app/components/login/login",
    controller: "LoginCtrl"
  })
  .when('/team-login', {
    templateUrl: "app/components/login/team-login",
    controller: "TeamLoginCtrl",
    resolve: {isAuth}
  })
  .when('/team-login/register', {
    templateUrl: "app/components/login/team-register",
    controller: "TeamRegisterCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id', {
    templateUrl: "app/components/all-docs/all-docs",
    controller: "AllDocsCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id/new', {
    templateUrl: "app/components/new-doc/new-doc",
    controller: "NewDocCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id/pending/:doc_id', {
    templateUrl: "app/components/review/review",
    controller: "ReviewCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id/completed/:doc_id', {
    templateUrl: "app/components/review/review",
    controller: "ReviewCtrl",
    resolve: {isAuth}
  })
  .otherwise('/login')
)
.run(FirebaseCredentials =>
  firebase.initializeApp(FirebaseCredentials)
);
