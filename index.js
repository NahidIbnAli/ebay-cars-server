const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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
    const bookingCollection = client.db("eBayCars").collection("bookings");
    const carCategoryCollection = client
      .db("eBayCars")
      .collection("carCategories");
    const testimonialCollection = client
      .db("eBayCars")
      .collection("testimonials");
    const blogCollection = client.db("eBayCars").collection("blogs");
    const userCollection = client.db("eBayCars").collection("users");

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

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        name: booking.name,
        price: booking.price,
        email: booking.email,
      };
      const alreadyBooked = await bookingCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You have already booked ${booking.name}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/carCategories", async (req, res) => {
      const query = {};
      const carCategories = await carCategoryCollection.find(query).toArray();
      res.send(carCategories);
    });

    app.get("/category/:name", async (req, res) => {
      const categoryName = req.params.name;
      const query = { category: categoryName };
      const allAdvertisedItems = await advertisedItemCollection
        .find(query)
        .toArray();
      res.send(allAdvertisedItems);
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

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: req.body.email };
      const storedUser = await userCollection.findOne(query);
      if (!storedUser) {
        const result = await userCollection.insertOne(user);
        return res.send(result);
      }
      res.send({ message: "this email already exists" });
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
  } finally {
  }
}
run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`eBay cars server is running on port : ${port}`);
});
