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
function verifyJwt(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'UnAthorized Access'});
  }
  const token =authHeader.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRATE,function(err,decoded){
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded=decoded;
    next();
  });
}
async function run(){
  try{
    await client.connect();
    const toolsCollection = client
      .db("manufacture-car-tools")
      .collection("tools");
    const ordersCollection = client
      .db("manufacture-car-tools")
      .collection("orders");
    const usersCollection = client
      .db("manufacture-car-tools")
      .collection("users");

    //users
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRATE,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    //make Admin
    app.put("/user/admin/:email",verifyJwt, async (req, res) => {
      const email = req.params.email;
      const requester=req.decoded.email;
      const requesterAccount=await usersCollection.findOne({email:requester});
      if(requesterAccount.role === 'admin'){
         const filter = { email: email };
         const updateDoc = {
           $set: { role: "admin" },
         };

         const result = await usersCollection.updateOne(filter, updateDoc);
         res.send(result);
        
      }
      else{
        res.status(403).send({message:'forbidden'});
      }
     
    });
    //check Admin
    app.get('/admin/:email',async(req,res)=>{
      const email=req.params.email;
      const user= await usersCollection.findOne({email:email});
      const isAdmin=user.role === 'admin';
      res.send({admin :isAdmin})
    });
    //get Users
    app.get("/user", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

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
    app.post("/order", async (req, res) => {
      const orders = req.body;
      const result = await ordersCollection.insertOne(orders);
      res.send(result);
    });
    app.get("/order", verifyJwt, async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });

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
