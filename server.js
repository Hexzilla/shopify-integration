import express from "express";
import cors from "cors";
import shopify from "./shopify.js";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(shopify);

const server = app.listen(8080, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});
