import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION, Session } from "@shopify/shopify-api";
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
  scopes: ["read_products", "write_products"],
  hostName: process.env.SHOPIFY_APP_HOST_NAME,
  apiVersion: LATEST_API_VERSION,
});

let session_sample = new Session({
  id: "offline_max-dev-2080.myshopify.com",
  shop: "max-dev-2080.myshopify.com",
  state: "988806641198443",
  isOnline: false,
  scope: "write_products",
  accessToken: "shpua_9f0101ba9102381ce25a69e941966d3b",
});

const router = express.Router();

router.get("/", async (req, res) => {
  res.send("<script>window.close()</script>");
});

router.get("/auth", async (req, res) => {
  try {
    // The library will automatically redirect the user
    await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(req.query.shop, true),
      callbackPath: "/auth/callback",
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (err) {
    console.error(err);
  }
});

// Register webhooks after OAuth completes
router.get("/auth/callback", async (req, res) => {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const session = callbackResponse.session;
    session_sample = session;
    console.log("session_sample", session_sample);
    //TODO - save session to database
  } catch (e) {}

  return res.redirect("/"); // or wherever you want your user to end up after OAuth completes
});

router.get("/status", async (req, res) => {
  if (req.query.shop === session_sample.shop) {
    res.json({ connected: true });
  } else {
    res.json({ connected: false });
  }
});

router.get("/session", async (req, res) => {
  try {
    const offlineId = await shopify.session.getOfflineId(req.query.shop);
    console.log(`offlineId`, offlineId);

    const appSession = await shopify.session.customAppSession(req.query.shop);
    console.log(`appSession`, appSession);

    const sessionId = await shopify.session.getCurrentId({
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
    console.log(`sessionId`, sessionId);
  } catch (error) {
    console.error(error);
  }

  res.send({ success: true });
});

router.get("/products", async (req, res) => {
  try {
    //TODO - get session from database by search req.query.shop

    const client = new shopify.clients.Rest({
      session: session_sample,
      apiVersion: LATEST_API_VERSION,
    });

    const response = await client
      .get({
        path: "products",
      })
      .catch(console.error);

    if (response) {
      const { products } = response.body;
      console.log("Get Products~~~~~~~~~~~~", products);
      return res.json({ success: true, products });
    } else {
      return res.status(500).json({ success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const client = new shopify.clients.Rest({
      session: session_sample,
      apiVersion: LATEST_API_VERSION,
    });

    const response = await client
      .put({
        path: `products/${req.params.id}`,
        data: JSON.stringify({ product: req.body }),
      })
      .catch(console.error);

    if (response && response.body) {
      return res.json({ success: true, product: response.body });
    } else {
      return res.status(500).json({ success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

router.post("/products", async (req, res) => {
  try {
    const client = new shopify.clients.Rest({
      session: session_sample,
      apiVersion: LATEST_API_VERSION,
    });

    const response = await client
      .post({
        path: "products",
        data: JSON.stringify({ product: req.body }),
      })
      .catch(console.error);

    if (response && response.body) {
      return res.json({ success: true, product: response.body });
    } else {
      return res.status(500).json({ success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
});

export default router;
