"use strict";

angular.module("DocApp").controller("TeamLoginCtrl",
function($scope, $location, $route, $window, AuthFactory, TeamFactory) {
  const uid = firebase.auth().currentUser.uid;
  $scope.usersTeams = [];
  $scope.newTeams = [];

  const sortUserAccess = firebaseID =>
    TeamFactory.getTeam(firebaseID)
    .then(teamData => {
      if (teamData.users.includes(uid)) {
        $scope.usersTeams.push(teamData);
      } else {
        $scope.newTeams.push(teamData);
      }
    })
    .catch(err => console.log(err));

  TeamFactory.getTeams()
  .then(teams => {
    for (let id in teams) sortUserAccess(id);
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
