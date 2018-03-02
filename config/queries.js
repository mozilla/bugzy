const {getIteration} = require("../lib/iterationUtils");
const AS_COMPONENTS = ["Activity Streams: Newtab", "New Tab Page", "Activity Streams: Application Servers"];
const MESSAGE_CENTRE_META_BUG = 1432588;

const queries = {
  // AS Bugs in the current iteration
  current_iteration() {
    const data = getIteration();
    return {
      title: `Current Iteration (${data.number})`,
      start: data.start,
      due: data.due,
      query: {
        include_fields: ["id","summary", "status", "assigned_to", "blocks", "priority"],
        component: AS_COMPONENTS,
        iteration: data.number
      }
    };
  },

  // AS bugs included in the 60 MVP
  as_mvp_60() {
    return {
      title: "AS MVP 60",
      query: {
        component: AS_COMPONENTS,
        custom: {
          whiteboard: "[AS60MVP]"
        }
      }
    };
  },

  // All bugs attached to the Message Centre meta bug
  message_centre_bugs() {
    return {
      title: "Message Centre Bugs",
      query: {
        custom: {
          blocked: {equals: MESSAGE_CENTRE_META_BUG}
        }
      }
    }
  }

};

module.exports = {queries};
