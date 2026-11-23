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
const eventsCollection = database.collection("events");

app.get('/all-events/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(event);
});

/* show the all event object from database to server and  make api  */
app.get('/all-events', async (req, res) => {
  const cursor = eventsCollection.find({});
  const allValues = await cursor.toArray();
  res.send(allValues)
})

app.get("/recent-events", async (req, res) => {
  const events = await eventsCollection
    .find({ date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(6)
    .toArray();
  res.json(events);
});
/* Event inserting part */
app.post('/all-events', async (req, res) => {
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

  const result = await eventsCollection.insertOne(event);
  res.send(result)

})

/* existing Event details Updated part */
app.patch('/all-events', async (req, res) => {
  /* here is separated id and others data becuse already have _id that's an uniqe number */
  const { id, ...updatedData } = req.body
  const result = await eventsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData },
  )
  res.json(result)
})

/* card delete */
app.delete('/all-events', async (req, res) => {

  const { id } = req.body
  const result = await eventsCollection.deleteOne(
    { _id: new ObjectId(id) },

  )
  res.json(result)

})


/* dynamic joined_people id add kora lagbe */
const joinedPeopleCollection = database.collection("joined_people");
app.get('/joined_people/:id', async (req, res) => {
    const { id } = req.params;

    const result = await joinedPeopleCollection.findOne({
        _id: new ObjectId(id)
    });

    res.send(result);
});
/* show the all event */
app.get('/joined_people', async (req, res) => {
  const cursor = joinedPeopleCollection.find({});
  const allValues = await cursor.toArray();
  res.send(allValues)
})


/* joinig data insert form the all event */
app.post('/joined_people', async (req, res) => {
  const joinedData = req.body;

  const alreadyJoined = await joinedPeopleCollection.findOne({
    joinerEmail: joinedData.joinerEmail,
    eventId: joinedData.eventId,
  });

  if (alreadyJoined) {
    return res.send({ message: "Already joined this event" });
  }

  const { _id, ...data } = joinedData;

  const result = await joinedPeopleCollection.insertOne(data);

  res.send(result);
});


app.delete('/joined_people', async (req, res) => {

  const { id } = req.body
  const result = await joinedPeopleCollection.deleteOne(
    { _id: new ObjectId(id) },

  )
  res.json(result)

})