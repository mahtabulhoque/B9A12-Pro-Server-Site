const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// Mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i8q8q4e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // verify Admin middleware

    const verifyAdmin = async (req, res, next) => {
      const user = req.user;
      const query = { email: user?.email };
      const result = await userCollection.findOne(query);
      if (!result || result?.role !== "Admin")
        return res.status(401).send({ message: "forbidden access" });
    };

    const surveyCollection = client.db("Pro-Survey").collection("survey");
    const userCollection = client.db("Pro-Survey").collection("users");
    const votesCollection = client.db("Pro-Survey").collection("vote");
    const paymentCollection = client.db("Pro-Survey").collection("payment");
    const questionCollections = client.db("Pro-Survey").collection("question");
    const commentCollection = client.db('Pro-Survey').collection('comments')
    const reportCollection = client.db('Pro-Survey').collection('reports')
    // User Related Api
    app.put("/user", async (req, res) => {
      const user = req.body;
      try {
        const isExist = await userCollection.findOne({ email: user?.email });
        if (isExist) return res.send(isExist);

        const options = { upsert: true };
        const query = { email: user?.email };
        const updateDoc = {
          $set: {
            ...user,
            timestamp: Date.now(),
          },
        };

        const result = await userCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ error: "Failed to update user" });
      }
    });

    //  get a user by email

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    //  get all users from db

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // update user role

    app.patch("/users/update/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email };
      const updateDoc = {
        $set: { ...user, timestamp: new Date() },
      };

      try {
        const result = await userCollection.updateOne(query, updateDoc);
        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "User role updated successfully",
          });
        } else {
          res.status(404).send({ success: false, message: "User not found" });
        }
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Error updating user role", error });
      }
    });

    // Survey creation API

    app.post("/create", async (req, res) => {
      const createdSurvey = req.body;
      const result = await surveyCollection.insertOne(createdSurvey);
      res.send(result);
    });

    // Fetch questions by survey ID
app.get("/survey/:id/questions", async (req, res) => {
  const surveyId = req.params.id;

  try {
    const survey = await surveyCollection.findOne(
      { _id: new ObjectId(surveyId) },
      { projection: { questions: 1 } }
    );

    if (!survey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    res.json(survey.questions || []);
  } catch (error) {
    console.error("Error fetching survey questions:", error);
    res.status(500).json({ error: "Failed to fetch survey questions" });
  }
});

// Create a new survey
app.post("/create", async (req, res) => {
  const formData = req.body; // Extract all form data
  try {
    const result = await surveyCollection.insertOne(formData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating survey:", error);
    res.status(500).json({ error: "Failed to create survey" });
  }
});

// Submit survey answers
app.post('/api/submit-survey', async (req, res) => {
  const { answers, surveyId } = req.body;
  try {
    const survey = await surveyCollection.findOne({ _id: new ObjectId(surveyId) });
    if (!survey) {
      return res.status(404).send({ message: "Survey not found" });
    }
    const updatedSurvey = await surveyCollection.updateOne(
      { _id: new ObjectId(surveyId) },
      { $push: { answers: { $each: answers } } }
    );
    res.status(200).send("Survey submitted successfully");
  } catch (error) {
    console.error("Error submitting survey answers:", error);
    res.status(500).send("Internal Server Error");
  }
});

// comment

app.post("/survey/:id/comment", async (req, res) => {
  const surveyId = req.params.id;
  const { comment, userEmail } = req.body; // Include userEmail in the request body

  try {
    const result = await commentCollection.insertOne({
      surveyId: new ObjectId(surveyId),
      comment,
      userEmail, // Store userEmail along with the comment
      timestamp: new Date(),
    });

    res.status(201).send(result);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/survey/:id/comments/:userEmail", async (req, res) => {
  const surveyId = req.params.id;
  const userEmail = req.params.userEmail;

  try {
    const comments = await commentCollection.find({
      surveyId: new ObjectId(surveyId),
      userEmail, // Filter comments by userEmail
    }).toArray();

    res.status(200).send(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).send('Internal Server Error');
  }
});
// REport

app.post("/survey/:id/report", async (req, res) => {
  const surveyId = req.params.id;
  const { report, userEmail } = req.body; // Include userEmail in the request body

  try {
    const result = await reportCollection.insertOne({
      surveyId: new ObjectId(surveyId),
      report,
      userEmail, // Store userEmail along with the comment
      timestamp: new Date(),
    });

    res.status(201).send(result);
  } catch (error) {
    console.error('Error posting report:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/survey/:id/report/:userEmail", async (req, res) => {
  const surveyId = req.params.id;
  const userEmail = req.params.userEmail;

  try {
    const report = await reportCollection.find({
      surveyId: new ObjectId(surveyId),
      userEmail, // Filter comments by userEmail
    }).toArray();

    res.status(200).send(report);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).send('Internal Server Error');
  }
});



    // Get all survey
    app.get("/survey", async (req, res) => {
      const filterType = req.query.filterType;

      try {
        let result;
        if (filterType === "mostVoted") {
          result = await surveyCollection
            .find()
            .sort({ voteCount: -1 })
            .toArray();
        } else if (filterType === "latest") {
          result = await surveyCollection
            .find()
            .sort({ timestamp: -1 })
            .toArray();
        } else {
          result = await surveyCollection.find().toArray();
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching surveys:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // filter survey

    app.get("/surveys", async (req, res) => {
      const filter = req.query.filter;
      const sort = req.query.sort;
      let query = {};
      if (filter) {
        query = { ...query, category: filter };
      }
      let options = {};
      if (sort) {
        options = { sort: { voteCount: sort === "asc" ? 1 : -1 } };
      }
      const result = await surveyCollection.find(query, options).toArray();
      res.send(result);
    });

    app.post("/api/submit-survey", async (req, res) => {
      const surveyAnswers = req.body;
      // Process and store the survey answers in the database if necessary
      // For this example, we simply log them
      console.log("Received survey answers:", surveyAnswers);
      res.status(200).send("Survey submitted successfully");
    });

    //  Get a survey by Id

    app.get("/survey/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid survey ID format" });
      }

      const query = { _id: new ObjectId(id) };

      try {
        const result = await surveyCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ error: "Survey not found" });
        }
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ error: "An error occurred while retrieving the survey" });
      }
    });

    // get survey by email

    app.get("/surveys/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const query = { surveyor_email: email }; // Use the email parameter from the request
        const viewSurvey = await surveyCollection.find(query).toArray();
        res.send(viewSurvey);
      } catch (error) {
        res.status(500).send({
          message: "An error occurred while fetching surveys",
          error: error.message,
        });
      }
    });

    // update a survey

    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await surveyCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        { $set: updateData },
        { upsert: true }
      );
      res.send(result);
    });

    // for vote survey
    app.post("/votes", async (req, res) => {
      try {
        const voteSurvey = req.body;
        const voteId = voteSurvey.voteId;

        const result = await votesCollection.insertOne(voteSurvey);

        const voteQuery = { _id: new ObjectId(voteId) };
        const updateDoc = {
          $inc: { voteCount: 1 },
        };
        const updateVoteCount = await surveyCollection.updateOne(
          voteQuery,
          updateDoc
        );

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });

    // payment related API
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100); // Convert to cents or smallest currency unit

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
      }
    });

    app.get("/payments", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    app.get("/payments/:email", async (req, res) => {
      const query = { email: req.params.email };
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;

      try {
        const paymentResult = await paymentCollection.insertOne(payment);
        console.log("Payment Info", payment);
        const userUpdateResult = await userCollection.updateOne(
          { email: payment?.email },
          {
            $set: { role: "Pro-user" },
          }
        );

        res.send({ paymentResult, userUpdateResult });
      } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("B9A12 Assignment");
});

app.listen(port, () => {
  console.log(`B9A12 Assignment is running ${port}`);
});
