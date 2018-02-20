"use strict";

angular.module("DocApp").service("InterfaceServices", function() {
  // Stores index of most recently viewed comment
  let currentIndex = -1;

  // Gets current 'commented' segments
  const comments = () => [...document.getElementsByClassName("commented")]
    .filter(({localName}) => localName === "span");

  const findSegment = segments => {
    // Gets the DOM elm with the comment to show
    let commentToShow = comments()[currentIndex];
    // Gets the segment associated with the current comment
    return segments.find(segment => segment.firebaseID === commentToShow.id);
  };

  // Increases currentIndex 1 or circles around to 0
  const next = () => {
    currentIndex = currentIndex < comments().length - 1 ? currentIndex + 1 : 0;
  };

  // Decreases currentIndex 1 or circles back to last comment
  const prev = () => {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : comments().length - 1;
  };

  // Sets currentIndex to index of clicked on comment
  const setIndex = id => {
    currentIndex = comments()
    .findIndex(comment => comment.id === id);
  };

  return {findSegment, next, prev, setIndex};
});
