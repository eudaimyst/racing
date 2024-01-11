//import * as PIXI from "pixi.js"; //requires accessing PIXI. (for dev/learning)
import { Application, Texture, Sprite } from 'pixi.js'; //allows accessing directly, better performance
import World from './world/world.js';
import { SpawnBunny } from './world/objects/bunny.js';
import { io } from 'socket.io-client';
import { Ticker } from 'pixi.js';

import * as Debug from './debug.js';

const ticker = Ticker.shared;
let bunnies = [];
let currentBunny; //index in bunnies array of bunny assigned to camera
let world;
let app;
let socket;
const serverUpdateFreq = 1000; //how often to send updates to server
let serverUpdateTimer = 0; //timer used to send updates to server

//for debugging use this line to remove uniqueID in local storage to simulate new client
//localStorage.removeItem('uniqueID');

function establishConnection(callback) {
	socket = io('http://192.168.0.2:3000', {});
	console.log(socket);

	socket.on('bunny created', (dbID, x, y) => {
		console.log('bunny created with id: ' + dbID);
		let bunny = SpawnBunny(world, x, y, dbID);
		world.GetCamera().Assign(bunny);
		bunnies.push(bunny);
		currentBunny = bunnies.length - 1;
	});

	socket.on('game object updated', (dbID, x, y) => {
		console.log('receiving update: ' + dbID);
		if (world.gameObjects[dbID]) {
			world.gameObjects[dbID].ReplicateMoveBy(x, y);
		} else {
			console.log('no object with id: ' + dbID);
		}
	});

	if (callback)
		socket.on('connect', () => {
			callback();
		});
}

const pointerPosition = { x: 0, y: 0 };
const pointerDownPos = { x: 0, y: 0 };
const pointerOffset = { x: 0, y: 0 };

export default class App extends Application {
	mouseDown = false;

	/**
	 * Initializes a pixijs application with the specified width, height, and background
	 * color, and sets up the game loop and server connection
	 * @param w - The width of the game screen.
	 * @param h - The parameter "h" in the constructor represents the height of the game or application.
	 * @param b - The parameter "b" represents the background color of the game.
	 * @returns The constructor is returning the instance of the class.
	 */
	constructor(w, h, b) {
		super({
			width: w,
			height: h,
			backgroundColor: b,
		});

		Debug.RegisterGame(this); //to access app from debug module
		app = this;
		world = new World(this);

		app.stage.addEventListener('pointermove', (e) => {
			(pointerPosition.x = e.global.x), (pointerPosition.y = e.global.y);
		});
		app.stage.eventMode = 'static';
		app.stage.on('pointerdown', () => {
			console.log('clicked ' + pointerPosition.x + ',' + pointerPosition.y);
			pointerDownPos.x = pointerPosition.x;
			pointerDownPos.y = pointerPosition.y;
			this.mouseDown = true;
		});
		app.stage.on('pointerup', () => {
			console.log('released ' + pointerPosition.x + ',' + pointerPosition.y);
			this.mouseDown = false;
		});

		ticker.add(() => this.gameLoop()); //add gameloop
		this.stage.addChild(DrawGradient(this.renderer.width, this.renderer.height)); //draw a gradient overlay to the stage
		this.stage.addChild(world); //add world container to the stage

		establishConnection(this.PostConnection);
		return this;
	}

	PostConnection = () => {
		console.log('socketID for server connection:', socket.id);
		if (!localStorage.getItem('uniqueID')) {
			console.log('client has no uniqueID, using socket id:', socket.id);
			localStorage.setItem('uniqueID', socket.id);
		}
		console.log('connecting using uniqueID: ', localStorage.getItem('uniqueID'));
		socket.emit('new client', localStorage.getItem('uniqueID'));
	};

	/* Creates sprite from createGradTexture function which returns texture.
	Colors of gradient are specified in colors array. Sprite positioned at bottom of stage.*/

	AddBunny() {
		//let bunny = SpawnBunny( world, world.currentCamera.position.x, world.currentCamera.position.y );
		//console.log(this)
		/**
		let bunny = SpawnBunny(world, 0, 0);
		app.stage.addChild(bunny);
		world.GetCamera().Assign(bunny);
		bunnies.push(bunny);
		currentBunny = bunnies.length - 1;
		Debug.Log(currentBunny);
		console.log('newBunny');
		 */
		socket.emit('add bunny', 0, 0);
		//console.log(world);
	}

	ClearDB() {
		socket.emit('clearDB');
	}

	NextBunny() {
		const currentID = bunnies.indexOf(bunnies[currentBunny]);
		if (bunnies[currentID + 1]) {
			currentBunny = currentBunny + 1;
			world.GetCamera().Assign(bunnies[currentBunny]);
		}
		Debug.Log(currentBunny);
	}

	PrevBunny() {
		const currentID = bunnies.indexOf(bunnies[currentBunny]);
		if (bunnies[currentID - 1]) {
			currentBunny = currentBunny - 1;
			world.GetCamera().Assign(bunnies[currentBunny]);
		}
		Debug.Log(currentBunny);
	}

	Disconnect() {
		console.log('socket disconnecting');
		console.log(socket);
		socket.disconnect();
	}

	Reconnect() {
		establishConnection();
	}

	/* The `gameLoop` function is a callback function that is called on every frame of the game. It takes
	a parameter `delta`, which represents the time elapsed since the last frame. */
	gameLoop = () => {
		pointerOffset.x = (pointerPosition.x - pointerDownPos.x) / 100;
		pointerOffset.y = (pointerPosition.y - pointerDownPos.y) / 100;
		if (this.mouseDown) {
			bunnies[currentBunny].MoveBy(pointerOffset.x, pointerOffset.y, socket);
		}
		//console.log(delta);
		serverUpdateTimer += ticker.deltaMS;
		//console.log(serverUpdateTimer);
		if (serverUpdateTimer >= serverUpdateFreq) {
			console.log('tick');
			socket.emit('cam pos update', world.GetCamPos().x, world.GetCamPos().y);
			serverUpdateTimer -= serverUpdateFreq;
		}
		world.Tick(ticker.deltaMS);
	};
}

function DrawGradient(width, height) {
	const createGradTexture = (colors) => {
		const quality = 32;
		const canvas = document.createElement('canvas');

		canvas.width = 1;
		canvas.height = quality;

		const ctx = canvas.getContext('2d');

		// use canvas2d API to create gradient
		const grd = ctx.createLinearGradient(0, 0, 0, quality);
		grd.addColorStop(0.25, colors[0]);
		grd.addColorStop(0.75, colors[1]);
		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, quality, quality);
		return Texture.from(canvas);
	};

	//#region gradient make gradient sprite for bottom of game
	const sprite = new Sprite(createGradTexture(['#3b669700', '#224062']));
	sprite.anchor.set(0, 1);
	sprite.height = height;
	sprite.width = width;
	sprite.position.set(0, height + sprite.height / 4);
	return sprite;
	//#endregion
}

/**
export const Init = (w, h, b) => {
	if (!gameCanvas) {
		MakeGame(w || 800, h || 600, b || '#00ff00');
	}
	Debug.Register(debugHandler); //to access game from debug module

	const cam = new Camera();
	console.log(cam);

	//#region background

	//const background = new Sprite(Texture.WHITE);
	const bgSpriteSpacing = 100;
	//background.width = gameCanvas.renderer.width;
	//background.height = gameCanvas.renderer.height;
	let bgDots = [];

	const makeBGDot = (x, y) => {
		const container = new Container();
		const dot = Sprite.from('images/bg.png');
		const dotPos = new Text(x + ',' + y, { fontSize: 8, fill: '#ffffff22' });
		dot.anchor.set(0.5);
		container.addChild(dot);
		container.addChild(dotPos);
		container.position.set(x, y);
		container.scale.set(1);
		return container;
	};
	for (let i = 0; i < gameCanvas.renderer.width / bgSpriteSpacing; i++) {
		for (let j = 0; j < gameCanvas.renderer.height / bgSpriteSpacing; j++) {
			bgDots.push(makeBGDot(i * bgSpriteSpacing, j * bgSpriteSpacing));
		}
	}
	const bgContainer = new Container();
	let bgOverlay = new Sprite(Texture.CLEAR);
	bgOverlay.width = gameCanvas.renderer.width;
	bgOverlay.height = gameCanvas.renderer.height;

	bgContainer.addChild(bgOverlay);
	for (dot of bgDots) {
		bgContainer.addChild(dot);
	}
	gameCanvas.stage.addChild(bgContainer);

	//#endregion


	return gameCanvas.view;
};

**/
