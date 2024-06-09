const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Mongodb
const { MongoClient, ServerApiVersion } = require("mongodb");
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
    await client.connect();

    const surveyCollection = client.db("Pro-Survey").collection("survey");
    const userCollection = client.db("Pro-Survey").collection("users");
    const SurveyResponses = client.db('Pro-Survey').collection("surveyId")

    // User Related Api
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log("Received user info:", user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      console.log("User inserted:", result);
      res.send(result);
    });

   // Survey creation API

   app.post('/create', async(req,res)=>{
    const createdSurvey = req.body
    const result = await surveyCollection.insertOne(createdSurvey)
    res.send(result)
   })
 

    // Route to update a survey
  
    




    


    
app.get("/api/survey/survey", async (req, res) => {
  try {
    const surveys = await surveyCollection.find().toArray();
    res.status(200).json(surveys);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


    




    // Send a ping to confirm a successful connection
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
