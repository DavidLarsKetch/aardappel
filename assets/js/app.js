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
// Is this constant necessary if FirebaseCredentials has the URL?
.constant("FBUrl", "https://davidlarsketch-8da73.firebaseio.com/fe-cap")
.config($routeProvider =>
  $routeProvider
  .when('/login', {
    templateUrl: "assets/partials/login",
    controller: "LoginCtrl"
  })
  .when('/team-login', {
    templateUrl: "assets/partials/team-login",
    controller: "TeamLoginCtrl",
    resolve: {isAuth}
  })
  .otherwise('/login')
)
.run(FirebaseCredentials =>
  firebase.initializeApp(FirebaseCredentials)
);
