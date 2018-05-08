const express = require('express');
const {fetchQuery} = require("./queryUtils");
const path = require("path");
const bodyParser = require('body-parser');
const {DateTime} = require("luxon");

const app = express();

app.use(bodyParser.json());
app.use(express.static('../content'));

const metasCache = {data: null, lastUpdated: null};
app.get('/api/metas', async (req, res) => {
  const now = DateTime.local();
  if (
    !metasCache.data ||
    !metasCache.lastUpdated ||
    now.diff(metasCache.lastUpdated, "hours") > 3 ||
    req.query.force
  ) {
    try {
      const {bugs} = await fetchQuery({
        include_fields: ["id", "summary"],
        custom: {
          blocked: {equals: "1433315"} // Epic bug
        }
      });
      if (bugs && bugs.length)
      metasCache.data = bugs.map(bug => ({
        id: bug.id,
        displayName: bug.summary.replace("[META] ", "")
      }));
      metasCache.lastUpdated = DateTime.local();
    } catch (e) {
      // Don't update if the data is bad
    }
  }
  res.send(metasCache.data);
});

app.post('/api/bugs', async (req, res) => {
  const data = await fetchQuery(req.body);
  res.send(data);
});

app.get('*', function(request, response) {
  response.sendFile(path.resolve(__dirname, '../content', 'index.html'));
});

const port = process.env.PORT || "1989";
app.listen(port, () => console.log(`Bugzy server running on ${port}!`));
