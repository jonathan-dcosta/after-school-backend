const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

let db;

                            /* =========================
                                      MIDDLEWARE
                              ========================= */
                          
app.use(express.json());


app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE'
  );
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers'
  );

  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }
  next();
});

// LOGGER middleware: logs every incoming request with method and URL.
app.use((request, response, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${request.method} ${request.url}`);
  next();
});

//   STATIC IMAGE middleware
//  - returns lesson images from /images
//  - if the file does not exist, returns a JSON error
app.use('/images', (request, response, next) => {
  const imagePath = path.join(__dirname, 'images', request.path);

  fs.access(imagePath, fs.constants.F_OK, err => {
    if (err) {
      return response
        .status(404)
        .json({ message: 'Image not found: ' + request.path });
    }
    response.sendFile(imagePath);
  });
});

/* =========================
   MONGODB CONNECTION
========================= */

// Use YOUR connection string here
MongoClient.connect(
  'mongodb+srv://Jonathan:Jonathan1508@cluster0.jjkjv3y.mongodb.net/after_school?retryWrites=true&w=majority&appName=Cluster0',
  { useUnifiedTopology: true },
  (error, client) => {
    if (error) {
      console.error('DB connection error:', error);
      return;
    }
    db = client.db('after_school');
    console.log('Connected to MongoDB');
  }
);

/* =========================
   BASIC ROUTE
========================= */

app.get('/', (request, response) => {
  response.send('Select a collection, e.g. /collection/lesson');
});

/* =========================
   GENERIC COLLECTION ROUTES
========================= */

app.param('collectionName', (request, response, next, collectionName) => {
  request.collection = db.collection(collectionName);
  return next();
});

// GET all docs of a collection
app.get('/collection/:collectionName', (request, response, next) => {
  request.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    response.send(results);
  });
});

// POST new document into a collection
app.post('/collection/:collectionName', (request, response, next) => {
  request.collection.insert(request.body, (e, results) => {
    if (e) return next(e);
    response.send(results.ops);
  });
});

// GET one document by ID
app.get('/collection/:collectionName/:id', (request, response, next) => {
  request.collection.findOne(
    { _id: new ObjectID(request.params.id) },
    (e, result) => {
      if (e) return next(e);
      response.send(result);
    }
  );
});

// PUT update document by ID
app.put('/collection/:collectionName/:id', (request, response, next) => {
  request.collection.updateOne(
    { _id: new ObjectID(request.params.id) },
    { $set: request.body },
    (e, result) => {
      if (e) return next(e);
      response.send(
        result.result.n === 1 ? { msg: 'success' } : { msg: 'error' }
      );
    }
  );
});

// DELETE document by ID
app.delete('/collection/:collectionName/:id', (request, response, next) => {
  request.collection.deleteOne(
    { _id: new ObjectID(request.params.id) },
    (e, result) => {
      if (e) return next(e);
      response.send(
        result.result.n === 1 ? { msg: 'success' } : { msg: 'error' }
      );
    }
  );
});

/* =========================
   COURSEWORK-SPECIFIC ROUTES
========================= */

// GET /lessons – all lessons (for marks)
app.get('/lessons', (request, response, next) => {
  db.collection('lesson')
    .find({})
    .toArray((e, results) => {
      if (e) return next(e);
      response.json(results);
    });
});

// POST /orders – save order (for marks)
app.post('/orders', (request, response, next) => {
  const order = request.body; // expected: { name, phone, lessonIDs, spaces }
  db.collection('order').insertOne(order, (e, result) => {
    if (e) return next(e);
    response.status(201).json(result.ops[0]);
  });
});

// PUT /lessons/:id – update any attribute (e.g. spaces) (for marks)
app.put('/lessons/:id', (request, response, next) => {
  const id = new ObjectID(request.params.id);
  db.collection('lesson').updateOne(
    { _id: id },
    { $set: request.body },
    (e, result) => {
      if (e) return next(e);
      if (result.result.n === 1) {
        response.json({ msg: 'success' });
      } else {
        response.status(404).json({ msg: 'lesson not found' });
      }
    }
  );
});

// SEARCH route – Back-End part of search (Approach 2)
// You are currently using front-end filtering (Approach 1),
// but this route is here so you can demonstrate it in Postman.
app.get('/search', (request, response, next) => {
  const q = request.query.q;
  if (!q) return response.json([]);

  const regex = new RegExp(q, 'i');
  const num = parseInt(q, 10);

  const searchQuery = {
    $or: [
      { subject: regex },
      { location: regex },
      // If q is a number, also match price or spaces
      ...(isNaN(num) ? [] : [{ price: num }, { spaces: num }])
    ]
  };

  db.collection('lesson')
    .find(searchQuery)
    .toArray((e, results) => {
      if (e) return next(e);
      response.json(results);
    });
});

/* =========================
   START SERVER
========================= */

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Express.js server is running on localhost:' + port);
});
