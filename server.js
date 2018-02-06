const request = require("request");
const LISTS = require("./data/lists.js");
const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest/bug";

function get(options) {
  return new Promise((resolve, reject) => {
    try {
      console.log("uri", BZ_BASE_URI);
      request({
        uri: BZ_BASE_URI,
        method: "GET",
        qs: options
      }, (error, resp, body) => {
        if (error) return reject(error);
        resolve(JSON.parse(body).bugs);
      });
    } catch (e) {
      reject(e);
    }
  });
}

const MESSAGE_CENTRE_META_BUG = 1432588;

async function getBugs(options) {
  let response;
  try {
    response = await get(options);
  } catch (e) {
    console.log(e);
  }
  return response;
}

const express = require("express");

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const cache = {};
app.get("/lists/:listId", async (req, res) => {
  const {listId} = req.params;
  const data = LISTS[listId];
  if (!data) return res.send(404);
  if (!cache[listId]) {
    cache[listId] = await getBugs(data.query);
  }
  res.json({
    ...data,
    bugs: cache[listId]
  });
});

app.listen(1987, () => console.log("Listening on port 1987"));
