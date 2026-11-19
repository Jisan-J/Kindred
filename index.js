import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URI);


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
connectToMongoDB();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server is running ${PORT}`);

})

/* database and collection address */
const database = client.db("event_management");
const events = database.collection("events");

/* show the all event object from database to server and  make api  */
app.get('/all-events', async(req, res) => {
    const cursor = events.find({});
  const allValues = await cursor.toArray();
  res.send(allValues)
})


/* Event inserting part */
app.post('/all-events', async(req, res)=>{
  const data = req.body;
  /* separating the date to 3 property */
    const [year, month, day] = data.date.split("-");

  const event = {
    ...data,
    date: new Date(`${data.date}T00:00:00.000Z`),
    day,
    month: new Date(`${year}-${month}-01`)
      .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      .toUpperCase(),
    people: Number(data.people),
  };

  const result = await events.insertOne(event);
  res.send(result)
  
})

/* existing Event details Updated part */
app.patch('/all-events', async(req, res)=>{
  /* here is separated id becuse already have _id that's an uniqe number */
  const {id, ...updatedData} = req.body
  const result = await events.updateOne(
    {_id: new ObjectId(id)},
    {$set:updatedData},
  )
  res.json(result)
})