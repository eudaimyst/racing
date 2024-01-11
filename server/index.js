import { Server } from 'socket.io';
import { ObjectId, MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

//express used require globals, this replaces them for es6
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//require('dotenv').config()
console.log(process.env.MONGODB_CONNECTION_STRING);

//const express = require('express');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
	},
});

//express serves a webpage
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
	console.log('listening on *:3000');
});

/* MongoDB settings */
const uri = process.env.MONGODB_CONNECTION_STRING;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let mongoClient = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

/* MongoDB events */

let gameDB, clientColl, gameObjectColl, clientStream, gameObjectStream;
async function establishConnection() {
	try {
		console.log('connecting');
		await mongoClient.connect();
		await mongoClient.db('admin').command({ ping: 1 }); // Send a ping to confirm a successful connection
		console.log('Pinged your deployment. You successfully connected to MongoDB!');
		gameDB = mongoClient.db('game'); //if the db does not exist it is created
		clientColl = gameDB.collection('clients');
		gameObjectColl = gameDB.collection('gameObjects');
		//gameObjectColl.insertOne({ test: 'testing' });
		//clientColl.insertOne({ test: 'testing' });

		gameObjectStream = gameObjectColl.watch();
		clientStream = clientColl.watch();

		gameObjectStream.on('change', (next) => {
			//whenever a gameObject document changes
			switch (next.operationType) {
				case 'insert':
					console.log('gameObject inserted');
					io.emit('bunny created', next.fullDocument._id, next.fullDocument.x, next.fullDocument.y);
					break;
				case 'update':
					console.log('gameObject updated');
					//console.log(next);
					io.emit(
						'game object updated',
						next.documentKey._id,
						next.updateDescription.updatedFields.x,
						next.updateDescription.updatedFields.y
					);
					break;
			}
		});
		/** set up a listener when change events are emitted (this is for chat messages)
    //changeStream = messages.watch();
    changeStream.on("change", next => {
      // process any change event
      switch (next.operationType) {
        case 'insert':
            io.emit('chat message update', next.fullDocument.message);
            console.log(next.fullDocument.message);
            break;

        case 'update':
            io.emit('chat message update', next.updateDescription.updatedFields.message);
            console.log(next.updateDescription.updatedFields.message);
      }
    });
    */
	} catch {
		console.log('error connecting to mongoDB or connection closed');
		// Ensures that the client will close when you finish/error
		//this should not trigger because we have registered to watch streams(?)
		await mongoClient.close();
	}
}

establishConnection().catch(console.dir);

/**
 * The function `findClient` searches for a client with a given unique ID in a database, and if the
 * client does not exist, it adds a new client with the given unique ID to the database.
 * @param uniqueID - The uniqueID parameter is the identifier used to find or add a client in the
 * database.
 */
async function findClientByUniqueID(uniqueID, socketID) {
	try {
		const updateDoc = { $set: { socketID: socketID } }; //define the update, set the docs socketid
		const updateQuery = { uniqueID: uniqueID };
		let doc = await clientColl.findOneAndUpdate(updateQuery, updateDoc, {});
		console.log('finding client with uniqueID: ', uniqueID);
		//console.log(doc);
		if (doc.value != null) {
			console.log('client exists in db, socketID updated to', socketID);
		} else {
			clientColl.insertOne({ uniqueID: uniqueID, socketID: uniqueID, x: 0, y: 0 });
			console.log('new client added to database with uniqueID: ', uniqueID);
		}
	} catch {
		console.log('unable to execute promise(?)');
	}
}

async function updateClientPosition(socketID, x, y) {
	try {
		const updateDoc = { $set: { x: x, y: y } }; //define the update, set the docs socketid
		const updateQuery = { socketID: socketID };
		let doc = await clientColl.findOneAndUpdate(updateQuery, updateDoc, {});
		//console.log('updating client with socketID: ', socketID);
		//console.log(doc);
		if (doc.value != null) {
			//console.log('client exists in db, position updated');
		} else {
			//console.log('client does not exist in db');
		}
	} catch {
		console.log('unable to execute updateClientPosition promise(?)');
	}
}

/* socketio events */

io.on('connection', (socket) => {
	//console.log(socket)
	console.log(
		'-----------\nNew connection socketID: ' +
			socket.id +
			'\nhandshake address: ' +
			socket.handshake.address +
			'\n-----------'
	);
	socket.on('cam pos update', (x, y) => {
		//console.log('cam pos update: ', socket.id, x, y);
		updateClientPosition(socket.id, x, y).catch(console.dir);
	});
	socket.on('new client', (uniqueID) => {
		if (uniqueID) console.log(socket.id, 'connected with unique ID: ', uniqueID);
		findClientByUniqueID(uniqueID, socket.id).catch(); //always returns the promise
		//anything after this will happen before database is searched for uniqueID
	});
	socket.on('clearDB', () => {
		console.log('clearing DB');
		gameObjectColl.deleteMany();
	});

	socket.on('add bunny', (x, y) => {
		//collection.insertOne({});
		clientColl.findOne({ socketID: socket.id }, {}).then(
			(result) => {
				if (result.uniqueID) {
					console.log(result.uniqueID);
					gameObjectColl.insertOne({ x: x, y: y, owner: result.uniqueID }).then(
						(result) => {
							console.log('game object created with id: ' + result.insertedId);
							//io.emit('bunny created', result.insertedId, result.x, result.y);
						},
						(err) => console.error('Something went wrong2: ' + err)
					);
				} else console.log('could not get uniqueID from socketID');
			},
			(err) => console.error('Something went wrong: ' + err)
		);
		console.log('new bunny!');
	});

	socket.on('game object update', (id, x, y) => {
		gameObjectColl.findOne({ _id: ObjectId(id) }, {}).then(
			(result) => {
				console.log(result);
				const newX = result.x + x;
				const newY = result.y + y;
				gameObjectColl.updateOne({ _id: ObjectId(id) }, { $set: { x: newX, y: newY } }).then(
					(result) => console.log('updated object pos in DB'),
					(err) => console.error('Something went wrong updating object pos in DB: ' + err)
				);
			},
			(err) => {
				console.error('Something went wrong: ' + err);
			}
		);
	});
});
