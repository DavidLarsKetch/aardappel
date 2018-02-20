"use strict";

angular.module("DocApp").service('BoolServices', function() {
////// Checks whether passed in property is not undefined
  const notUndefined = property => typeof property !== "undefined";

////// Checks whether array of classes has the class passed in
  const hasClass = (arrayOfClasses, classToCheck) =>
    notUndefined(arrayOfClasses) && arrayOfClasses.includes(classToCheck);

////// Checks whether segment has temp_uid & whether the temp
    // edit is the current user's
  const isUidTemp = (temp_uid, uid) =>
    notUndefined(temp_uid) && temp_uid === uid;

  return {hasClass, notUndefined, isUidTemp};
});
