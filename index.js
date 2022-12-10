const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlhnchw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    // JWT authentication
    function verifyJWT(req, res, next) {

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send('unauthorized access');
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            req.decoded = decoded;
            next();
        })
    }

    try {
        const addressCollection = client.db('vouch-digital').collection('addressBook');

        app.post('/addressBook', verifyJWT, async (req, res) => {
            const address = req.body;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const result = await addressCollection.insertOne(address);
            res.send(result);
        })

        // get all contacts
        app.get('/contacts', async (req, res) => {
            const query = {};
            const result = await addressCollection.find(query).toArray();
            res.send(result);
        })

        //delete Contacts
        app.delete('/contacts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await addressCollection.deleteOne(filter);
            res.send(result)
        })

        //get specific contact for update
        app.get('/contacts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const contact = await addressCollection.findOne(query);
            res.send(contact);
        })

        // for update
        app.put('/contacts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const contact = req.body;
            console.log(contact);
            const option = { upsert: true };
            const updatedContact = {
                $set: {
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    location: contact.location,
                }
            }
            const result = await addressCollection.updateOne(filter, updatedContact, option);
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await addressCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            console.log(user);
            res.status(403).send({ accessToken: '' });
        })

    } finally {

    }
}
run().catch(err => console.log(err));

app.get('/', async (req, res) => {
    res.send('server is running');
})

app.listen(port, async (req, res) => {
    console.log(`Server is running on port ${port}`);
})