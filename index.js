const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const productCollection = client.db("eBayCars").collection("products");
    const bookingCollection = client.db("eBayCars").collection("bookings");
    const carCategoryCollection = client
      .db("eBayCars")
      .collection("carCategories");
    const testimonialCollection = client
      .db("eBayCars")
      .collection("testimonials");
    const blogCollection = client.db("eBayCars").collection("blogs");
    const userCollection = client.db("eBayCars").collection("users");

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await userCollection.findOne(query);
      if (user?.role !== "Admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await userCollection.findOne(query);
      if (user?.role !== "Seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/", async (req, res) => {
      res.send("eBay Cars server is running");
    });

    app.get("/products", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const products = await productCollection.find(query).toArray();
      res.send(products);
    });

    app.post("/products", verifyJWT, verifySeller, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
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

    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      const query = { email: email };
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const booked = await bookingCollection.find(query).toArray();
      res.send(booked);
    });

    app.get("/carCategories", async (req, res) => {
      const query = {};
      const carCategories = await carCategoryCollection.find(query).toArray();
      res.send(carCategories);
    });

    app.get("/category/:name", async (req, res) => {
      const categoryName = req.params.name;
      const query = { category: categoryName };
      const allProudcts = await productCollection.find(query).toArray();
      res.send(allProudcts);
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

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isSeller: user?.role === "Seller" });
    });

    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isBuyer: user?.role === "Buyer" });
    });

    app.put("/users/verify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          verified: true,
        },
      };
      const options = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/users/verified/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isVerified: user?.verified === true });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: req.body.email };
      const storedUser = await userCollection.findOne(query);
      if (!storedUser) {
        const result = await userCollection.insertOne(user);
        return res.send(result);
      }
      res.send({ message: "email already exists" });
    });

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {};
      const users = await userCollection.find(query).toArray();
      res.send(users);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "Admin" });
    });

    app.put("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "Admin",
        },
      };
      const options = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
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
