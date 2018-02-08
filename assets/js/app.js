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
    templateUrl: "assets/partials/login",
    controller: "LoginCtrl"
  })
  .when('/register', {
    templateUrl: "assets/partials/user-register",
    controller: "UserRegisterCtrl"
  })
  .when('/team-login', {
    templateUrl: "assets/partials/team-login",
    controller: "TeamLoginCtrl",
    resolve: {isAuth}
  })
  .when('/team-login/register', {
    templateUrl: "assets/partials/team-register",
    controller: "TeamRegisterCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id', {
    templateUrl: "assets/partials/all-docs",
    controller: "AllDocsCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id/new', {
    templateUrl: "assets/partials/new-doc",
    controller: "NewDocCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id/pending/:doc_id', {
    templateUrl: "assets/partials/review-pending",
    controller: "ReviewPendingCtrl",
    resolve: {isAuth}
  })
  .when('/docs/:team_id/completed/:doc_id', {
    templateUrl: "assets/partials/review-completed",
    controller: "ReviewCompletedCtrl",
    resolve: {isAuth}
  })
  .otherwise('/login')
)
.run(FirebaseCredentials =>
  firebase.initializeApp(FirebaseCredentials)
);
