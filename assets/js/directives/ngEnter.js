"use strict";

// Adapted from http://eric.sau.pe/angularjs-detect-enter-key-ngenter/

angular.module('DocApp').directive('ngEnter', () =>
  (scope, element, attrs) =>
    element.bind("keydown keypress", (e) => {
      if(e.key === "Enter") {
        scope.$apply(() =>
          scope.$eval(attrs.ngEnter)
        );
        e.preventDefault();
      }
    })
);
