// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import {
  addMessage,
  animateGift,
  isPossiblyAnimatingGift,
  isAnimatingGiftUI,
} from "./dom_updates.js";

const api = new APIWrapper(null, null, true);
// const api = new APIWrapper();

let animatedEvents = [];
let otherEvents = [];
let isStopped = true;

const duplicateFilterById = (array) =>
  array.filter((thing, index, self) => {
    let i = self.findIndex((t) => t.id === thing.id);
    index !== i && console.log("DUPLICATE_DELETED :", array[index]);
    return index === i;
  });

const filterByType = (events, type, isAllow = true) =>
  isAllow
    ? events.filter((event) => event.type === type)
    : events.filter((event) => event.type !== type);

const isOutDated = (event) => Date.now() - event.timestamp.getTime() > 20000;

const rateLimitDelay = (miliseconds) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, miliseconds);
  });

const executeAG = (array) => {
  animateGift(array[0]);
  addMessage(array[0]);
  array.shift();
};

const executeOthers = (array) => {
  let isExecuted = false;

  while (!isExecuted) {
    if (array.length > 0) {
      if (array[0].type === API_EVENT_TYPE.MESSAGE) {
        let isOutDatedEvent = isOutDated(array[0]);
        if (isOutDatedEvent) {
          console.log("OUTDATED_DELETED :", array[0]);
          array.shift();
        } else {
          addMessage(array[0]);
          array.shift();
          isExecuted = true;
        }
      } else {
        addMessage(array[0]);
        array.shift();
        isExecuted = true;
      }
    } else {
      isExecuted = true;
    }
  }
};

const triggerExecution = async () => {
  console.log("animated :", animatedEvents.length);
  console.log("other    :", otherEvents.length);
  if (
    !isPossiblyAnimatingGift() &&
    !isAnimatingGiftUI() &&
    animatedEvents.length > 0
  ) {
    executeAG(animatedEvents);
  } else if (otherEvents.length > 0) {
    executeOthers(otherEvents);
  }

  if (animatedEvents.length > 0 || otherEvents.length > 0) {
    await rateLimitDelay(500);
    triggerExecution();
  } else {
    console.log("STOPPED");
    isStopped = true;
  }
};

api.setEventHandler((events) => {
  const withoutDuplicateEvents = duplicateFilterById(events);

  if (withoutDuplicateEvents.length > 0) {
    const animatedList = filterByType(
      withoutDuplicateEvents,
      API_EVENT_TYPE.ANIMATED_GIFT
    );
    animatedEvents.push(...animatedList);

    const otherList = filterByType(
      withoutDuplicateEvents,
      API_EVENT_TYPE.ANIMATED_GIFT,
      false
    );
    otherEvents.push(...otherList);

    if (isStopped) {
      isStopped = false;
      console.log("STARTED");
      triggerExecution();
    }
  }
});
