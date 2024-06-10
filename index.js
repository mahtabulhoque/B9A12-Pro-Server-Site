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
    
        const result = await userCollection.updateOne(query, updateDoc, options);
        res.send(result);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ error: "Failed to update user" });
      }
    });

  //  get a user by email

  app.get('/user/:email', async (req,res)=>{
    const email = req.params.email
    const result = await userCollection.findOne({email})
    res.send(result)
  })


  //  get all users from db

  app.get('/users', async (req,res)=>{
    const result = await userCollection.find().toArray()
    res.send(result)
  })


    // update user role

    app.patch('/users/update/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email };
      const updateDoc = {
        $set: { ...user, timestamp: new Date() },
      };
      
      try {
        const result = await userCollection.updateOne(query, updateDoc);
        if (result.modifiedCount > 0) {
          res.send({ success: true, message: 'User role updated successfully' });
        } else {
          res.status(404).send({ success: false, message: 'User not found' });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: 'Error updating user role', error });
      }
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

// Get all survey
   app.get('/survey', async(req, res)=>{
    const result = await surveyCollection.find().toArray()
    res.send(result)
   })


    




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
