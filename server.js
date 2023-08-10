import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import express from "express";

const shopify = shopifyApi({
  // The next 4 values are typically read from environment variables for added security
  apiKey: "",
  apiSecretKey: "",
  scopes: ["read_products", "write_products"],
  hostName: "6e5c-188-43-14-13.ngrok-free.app",
});

const app = express();

app.get("/", function (req, res) {
  res.send("Hello World");
});

// Register webhooks after OAuth completes
app.get("/auth/callback", async (req, res) => {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const response = await shopify.webhooks.register({
      session: callbackResponse.session,
    });

    if (!response["PRODUCTS_CREATE"][0].success) {
      console.log(
        `Failed to register PRODUCTS_CREATE webhook: ${response["PRODUCTS_CREATE"][0].result}`
      );
    }
  } catch (error) {
    console.error(error); // in practice these should be handled more gracefully
  }

  return res.redirect("/"); // or wherever you want your user to end up after OAuth completes
});

app.get("/auth", async (req, res) => {
  // The library will automatically redirect the user
  await shopify.auth.begin({
    shop: shopify.utils.sanitizeShop(req.query.shop, true),
    callbackPath: "/auth/callback",
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
});

const server = app.listen(8080, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);
});
