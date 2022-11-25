const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wgjxpn1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const advertisedItemCollection = client
      .db("eBayCars")
      .collection("advertisedItems");
    const carCategoryCollection = client
      .db("eBayCars")
      .collection("carCategories");
    const testimonialCollection = client
      .db("eBayCars")
      .collection("testimonials");
    const blogCollection = client.db("eBayCars").collection("blogs");

    app.get("/", async (req, res) => {
      res.send("eBay Cars server is running");
    });

    app.get("/advertisedItems", async (req, res) => {
      const query = {};
      const advertisedItems = await advertisedItemCollection
        .find(query)
        .toArray();
      res.send(advertisedItems);
    });

    app.get("/carCategories", async (req, res) => {
      const query = {};
      const carCategories = await carCategoryCollection.find(query).toArray();
      res.send(carCategories);
    });

    app.get("/testimonials", async (req, res) => {
      const query = {};
      const testimonials = await testimonialCollection.find(query).toArray();
      res.send(testimonials);
    });

    app.get("/blogs", async (req, res) => {
      const query = {};
      const blogs = await blogCollection.find(query).toArray();
      res.send(blogs);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`eBay cars server is running on port : ${port}`);
});
