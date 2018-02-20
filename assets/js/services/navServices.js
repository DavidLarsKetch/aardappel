"use strict";

angular.module("DocApp").service("NavServices", function($routeParams, $window) {

  const getDocID = () => $routeParams.doc_id;

  const getTeamsID = () => $routeParams.team_id;

  const toAllDocs = team_id =>
    $window.location.href = `#!/docs/${team_id}`;

  const toDocCompleted = (team_id, doc_id) =>
    $window.location.href = `#!/docs/${team_id}/completed/${doc_id}`;

  const toDocPending = (team_id, doc_id) =>
    $window.location.href = `#!/docs/${team_id}/pending/${doc_id}`;

  const toLogin = () => $window.location.href = `#!/login`;

  const toNewDoc = team_id =>
    $window.location.href = `#!/docs/${team_id}/new`;

  const toTeamsLogin = () => $window.location.href = `#!/team-login`;

  const toTeamRegister = () =>
    $window.location.href = `#!/team-login/register`;

  return {
    getDocID, getTeamsID, toAllDocs,
    toDocCompleted, toDocPending, toLogin,
    toNewDoc, toTeamsLogin, toTeamRegister
  };
});
