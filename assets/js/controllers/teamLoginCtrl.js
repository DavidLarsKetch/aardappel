"use strict";

angular.module("DocApp").controller("TeamLoginCtrl",
function(
  $scope, $route,
  NavServices,
  AuthFactory, TeamFactory, UserFactory
) {

  const loggedInUid = firebase.auth().currentUser.uid;
  $scope.usersTeams = [];
  $scope.newTeams = [];

  const sortUserAccess = firebaseID =>
    TeamFactory.getTeam(firebaseID)
    .then(teamData => {
      if (teamData.users.includes(loggedInUid)) {
        $scope.usersTeams.push(teamData);
      } else {
        $scope.newTeams.push(teamData);
      }
    })
    .catch(err => console.log(err));


  $scope.addUserToTeam = ({attempt, firebaseID, password, users}) => {
    if (password === attempt) {
      users.push(loggedInUid);
      TeamFactory.patchTeam(firebaseID, {users})
      .then(() => NavServices.go.toAllDocs(firebaseID))
      .catch(err => console.log(err));
    }
  };

  $scope.userLogout = () =>
    AuthFactory.logout().then(() => NavServices.go.toLogin());

  $scope.revokeAccess = firebaseID =>
    TeamFactory.getTeam(firebaseID)
    .then(({users}) => {
      users = users.filter(user => user !== loggedInUid);
      return TeamFactory.patchTeam(firebaseID, {users});
    })
    .then(() => $route.reload())
    .catch(err => console.log(err));

  $scope.toTeamRegister = () => NavServices.go.toTeamRegister();

  $scope.toAllDocs = team_id => NavServices.go.toAllDocs(team_id);

  $scope.toggleTeamPasswordInput = team =>
    team.showPasswordInput = team.showPasswordInput ? false : true;

  TeamFactory.getTeams()
  .then(teams => {
    for (let id in teams) sortUserAccess(id);
    return UserFactory.getUser(loggedInUid);
  })
  .then(({displayName}) => $scope.displayName = displayName)
  .catch(err => console.log(err));
});
