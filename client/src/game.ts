import { Application, Container, Sprite, Text, TextStyle, Ticker, TickerCallback } from 'pixi.js';
import { GameObject } from './game/game_object.ts';
import { Camera } from './game/camera.ts';
import Vehicle from './game/vehicle.ts';

const keys: Map<string, boolean> = new Map<string, boolean>();
let car: Vehicle;
let track: GameObject;
let camera: Camera;

const style = new TextStyle({
	fontSize: 12,
	lineHeight: 6,
	fill: '#ffffff',
});
const text: Text = new Text('', style);

export const Init = () => {
	console.log('Game initalized');
	const app = new Application({
		backgroundColor: '#8888DD',
		width: 1000,
		height: 1000,
	});
	document.addEventListener('keydown', keyDown);
	document.addEventListener('keyup', keyUp);

	camera = new Camera(app);
	car = new Vehicle(0, 0, 64, 64, camera);
	track = new GameObject(0, 0, 12000, 12000, './images/track.png', camera);

	app.stage.addChild(track);
	app.stage.addChild(car);
	app.stage.addChild(text);
	camera.FollowObject(car);

	Ticker.shared.add(doTick);

	return { app, SetDebugValue };
};

const SetDebugValue = (variableName: string, value: any) => {
	console.log(`Setting debug value ${variableName} to ${value}`);
	car.UpdateVar(variableName, value);
};

let speed = 5;
const doTick = () => {
	camera.UpdatePos();
	track.UpdatePos();
	let dt = Ticker.shared.deltaTime / 100; //ms is innacurate, lots of jumps
	car.Tick(dt);
	//let dt = Ticker.shared.deltaMS; //ms is innacurate, lots of jumps
	if (keys.get('Left')) {
		car.AddSteering(-1);
	}
	if (keys.get('Right')) {
		car.AddSteering(1);
	}
	if (keys.get('Up')) {
		car.AddThrust(1);
	}
	if (keys.get('Down')) {
		car.ApplyBrakes();
	}

	text.text = `stage: x${Math.floor(car.x)}, y${Math.floor(car.y)}, ${Math.floor(car.angle)}
		\nworld: x${Math.floor(car.worldPos.x)}, y${Math.floor(car.worldPos.y)}
		\ncamera: x${Math.floor(camera.position.x)}, y${Math.floor(camera.position.y)}
		\nsteeringAngle: ${Math.floor(car.steeringAngle)}
		\nthrust: ${Math.floor(car.thrust)}
		\nvelocity: ${Math.floor(car.velocity)}
		\nbraking: ${car.braking}
		`;
};

const keyDown = (e: KeyboardEvent): void => {
	//if the first letters of e.code equal 'Arrow'
	if (e.code.substring(0, 5) === 'Arrow') {
		//print the remaining value of the string
		//console.log(e.code.substring(5));
		keys.set(e.code.substring(5), true);
		e.preventDefault();
		//console.log(e.code, true);
	}
};
const keyUp = (e: KeyboardEvent): void => {
	if (e.code.substring(0, 5) === 'Arrow') {
		e.preventDefault();
		//console.log(e.code, false);
		keys.set(e.code.substring(5), false);
	}
};
