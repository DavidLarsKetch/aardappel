"use strict";

angular.module("DocApp").controller("TeamLoginCtrl",
function($scope, $location, $route, $window, AuthFactory, TeamFactory) {
  const uid = firebase.auth().currentUser.uid;
  $scope.usersTeams = [];
  $scope.newTeams = [];
  $scope.test = `Sup, TeamLoginCtrl. currentUser: ${firebase.auth().currentUser.uid}`;

  const checkUserAccess = firebaseID =>
    TeamFactory.getTeam(firebaseID)
    .then(teamData => {
      let check = teamData.users.indexOf(uid);
      if (check >= 0) {
        $scope.usersTeams.push(teamData);
      } else {
        $scope.newTeams.push(teamData);
      }
    })
    .catch(err => console.log(err));

  TeamFactory.getTeams()
  .then(teams => {
    for (let id in teams) checkUserAccess(id);
  })
  .catch(err => console.log(err));

  $scope.addUserToTeam = ({attempt, firebaseID, password, users}) => {
    if (password === attempt) {
      users.push(uid);
      TeamFactory.patchTeam(firebaseID, {users})
      .then(data => $location.path(`/docs/${firebaseID}`))
      .catch(err => console.log(err));
    }
  };

  $scope.userLogout = () =>
    AuthFactory.logout().then(() => $window.location.href = `#!/login`);

  $scope.revokeAccess = firebaseID =>
    TeamFactory.getTeam(firebaseID)
    .then(({users}) => {
      users = users.filter(user => user !== uid);
      return TeamFactory.patchTeam(firebaseID, {users});
    })
    .then(() => $route.reload())
    .catch(err => console.log(err));
});
