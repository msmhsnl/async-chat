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

const rateLimitDelay = (miliseconds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, miliseconds);
  });
};

const execute = async () => {
  if (
    !isPossiblyAnimatingGift() &&
    !isAnimatingGiftUI() &&
    animatedEvents.length > 0
  ) {
    executeAG(animatedEvents);
  } else if (otherEvents.length > 0) {
    executeOthers(otherEvents);
  }
  console.log("animated :", animatedEvents.length);
  console.log("other    :", otherEvents.length);
  if (animatedEvents.length > 0 || otherEvents.length > 0) {
    await rateLimitDelay(500);
    execute();
  } else {
    console.log("STOPPED");
    isStopped = true;
  }
};

const executeAG = (array) => {
  animateGift(array[0]);
  addMessage(array[0]);
  array.shift();
};

const isOutDated = (event) => Date.now() - event.timestamp.getTime() > 20000;

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

const duplicateFilterById = (array) => {
  const filtered = array.filter((thing, index, self) => {
    let i = self.findIndex((t) => t.id === thing.id);
    index !== i && console.log("DUPLICATE_DELETED :", array[index]);
    return index === i;
  });
  return filtered;
};

api.setEventHandler((events) => {
  let withoutDuplicateEvents = duplicateFilterById(events);

  if (withoutDuplicateEvents.length > 0) {
    withoutDuplicateEvents.map((event) => {
      //data.push(event);
      switch (event.type) {
        case API_EVENT_TYPE.ANIMATED_GIFT:
          animatedEvents.push(event);
          break;

        default:
          otherEvents.push(event);
          break;
      }
      // if (event.type === API_EVENT_TYPE.ANIMATED_GIFT) {
      //   animatedEvents.push(event);
      //   // animateGift(event);
      //   // addMessage(event);
      //   // console.log('isPossiblyAnimatingGift', isPossiblyAnimatingGift());
      //   // console.log('isAnimatingGiftUI', isAnimatingGiftUI());
      // } else {
      //   otherEvents.push(event);
      // }
    });
    if (isStopped) {
      isStopped = false;
      console.log("STARTED");
      execute();
    }
  }

  // events.map((event) => {
  //   console.log('EVENT', event);
  //   if (event.type === API_EVENT_TYPE.MESSAGE) {
  //     addMessage(event);
  //   } else if (event.type === API_EVENT_TYPE.ANIMATED_GIFT) {
  //     animateGift(event);
  //     addMessage(event);
  //   } else if (event.type === API_EVENT_TYPE.GIFT) {
  //     addMessage(event);
  //   }
  // });

  // ...
});

// NOTE: UI helper methods from `dom_updates` are already imported above.
