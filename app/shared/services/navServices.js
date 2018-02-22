"use strict";

angular.module("DocApp").service("NavServices", function($routeParams, $window) {
  const go = {};
  go.getDocID = () => $routeParams.doc_id;

  go.getTeamsID = () => $routeParams.team_id;

  go.toAllDocs = team_id =>
    $window.location.href = `#!/docs/${team_id}`;

  go.toDocCompleted = (team_id, doc_id) =>
    $window.location.href = `#!/docs/${team_id}/completed/${doc_id}`;

  go.toDocPending = (team_id, doc_id) =>
    $window.location.href = `#!/docs/${team_id}/pending/${doc_id}`;

  go.toLogin = () => $window.location.href = `#!/login`;

  go.toNewDoc = team_id =>
    $window.location.href = `#!/docs/${team_id}/new`;

  go.toTeamsLogin = () => $window.location.href = `#!/team-login`;

  go.toTeamRegister = () =>
    $window.location.href = `#!/team-login/register`;

  return {go};
});
