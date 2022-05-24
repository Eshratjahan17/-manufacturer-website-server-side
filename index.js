const express = require("express");
const app = express();
const cors = require('cors');
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port =process.env.PORT|| 5000;

app.use(cors());
app.use(express.json());

//connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uzzmy.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run(){
  try{
    await client.connect();
    const toolsCollection = client.db("manufacture-car-tools").collection("tools");
    const ordersCollection = client.db("manufacture-car-tools").collection("orders");
    //All data
    app.get("/tools", async (req, res) => {
      const q = req.query;
      console.log(q);
      const cursor = toolsCollection.find(q);
      const result = await cursor.toArray();
      res.send(result);
    });
    //specific data
    //http://localhost:5000/tool/:id
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    });
    //orders post
    app.post('/order',async(req,res)=>{
      const orders=req.body;
      const result=await ordersCollection.insertOne(orders);
      res.send(result);
    })

    console.log("db connected");
  }
  finally{

  }
  

}
run().catch(console.dir);
// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   console.log("db connected");
//   // perform actions on the collection object
//   client.close();
// });


app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
