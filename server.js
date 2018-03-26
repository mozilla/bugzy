const express = require('express');
const {fetchQuery} = require("./lib/queryUtils");
const path = require("path");
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.static('dist'));

app.post('/api/bugs', async (req, res) => {
  const data = await fetchQuery(req.body);
  res.send(data);
});

app.get('*', function(request, response) {
  response.sendFile(path.resolve(__dirname, './dist', 'index.html'));
});

const port = process.env.PORT || "1989";
app.listen(port, () => console.log(`Bugzy server running on ${port}!`));
