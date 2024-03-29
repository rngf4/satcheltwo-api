const express = require("express");
const cors = require("cors");
const routesMap = require("./routes/map.js");

const { authorise } = require("./helpers/auth.js");

const api = express();

api.use(cors());
api.use(express.json());

for (const [namespace, routes] of Object.entries(routesMap)) {
  for (const [route, settings] of Object.entries(routes)) {
    api[settings.method || "get"](
      `/${namespace}/${route}`,
      authorise(settings.level, settings.tokenRequired),
      async (req, res) => {
        const data = await settings.bind(req);
        res.json(data);
      }
    );
  }
}

api.get("/", async (req, res) => {
  res.send("index");
});

api.listen(3000, () => {
  console.log("listening on port 3000");
});
