import { Container, Sprite, Texture } from 'pixi.js';
import { default as GameObject } from './game_object.js';
import { default as Camera } from './camera.js';

import * as Debug from '../debug.js';

/* Subclass of Container that represents a game world and contains game objects, camera, and methods
for creating objects and updating game state. */
export default class World extends Container {
	gameObjects = [];
	currentCamera;
	app; //reference to pixi application object

	/* Initializes a new instance of the class with a default camera position.*/
	constructor(app) {
		super();
		this.app = app;
		this.currentCamera = new Camera(0, 0);
	}

	/* Returns a new game object class which extends container and adds it to game world container. */
	CreateObject = (id, x, y, texture) => {
		const obj = new GameObject(this, texture, x, y);
		this.gameObjects[id] = obj;
		this.addChild(obj);
		return obj;
	};

	/* Calls Tick method of each game object in array. Delta = the time elapsed since last frame. */
	Tick = (delta) => {
		//console.log('tick');
		for (let i = 0; i < this.gameObjects.length; i++) {
			this.gameObjects[i].Tick(delta);
		}
		//Debug.Log(this.GetCamPos());
		this.currentCamera.Tick();
	};

	/* Returns the position of the current camera in game world. */
	GetCamPos = () => {
		return this.currentCamera.position;
	};

	/* Returns position of current camera in game world, but offset by half screen size.
	Objects use this for relative positioning */
	GetCamPosOffset = () => {
		return this.currentCamera.position
			.clone()
			.set(
				this.currentCamera.position.x - this.app.renderer.width / 2,
				this.currentCamera.position.y - this.app.renderer.height / 2
			);
	};

	GetCamera = () => {
		return this.currentCamera;
	};
}
