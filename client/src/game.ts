import { Application, Text, TextStyle, Ticker } from 'pixi.js';
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
const debugText: Text = new Text('', style);

/**
 * Initializes a game by creating a new application, setting up event listeners for
 * keydown and keyup events, creating a camera, a car, and a track object, adding them to the
 * application's stage, and starting the game loop.
 * @returns Object that contains two properties: reference to the Pixi app and a callback function to SetDebugValue.
 */
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
	car = new Vehicle(0, 0, 200, 200, camera);
	track = new GameObject(0, 0, 12000, 12000, './images/track.png', camera);

	app.stage.addChild(track);
	app.stage.addChild(car);
	app.stage.addChild(debugText);
	camera.FollowObject(car);

	Ticker.shared.add(Tick);

	return { app, SetDebugValue };
};

/**
 * Callback sent to index.ts, passes variable to vehicle.ts updateSetting function
 * @param {string} variableName - A string representing the name of the setting to change.
 * @param {any} value - value ofthe setting.
 */
const SetDebugValue = (variableName: string, value: any) => {
	console.log(`passing new value ${value} for setting ${variableName} to vehicle`);
	car.updateSetting(variableName, value);
};

/**
 * The Tick function updates the position and movement of a car based on user input and displays debug
 * information.
 */
const Tick = () => {
	let dt = Ticker.shared.deltaMS * 0.001;
	camera.UpdatePos();
	track.UpdatePos();
	car.Tick(dt);

	if (keys.get('Left')) {
		car.ApplySteering(-1);
	}
	if (keys.get('Right')) {
		car.ApplySteering(1);
	}
	if (keys.get('Up')) {
		car.ApplyAccelerator();
	}
	if (keys.get('Down')) {
		car.ApplyBrake();
	}

	//debug text for basic vehicle movement
	debugText.text = `stage: x${Math.floor(car.x)}, y${Math.floor(car.y)}, ${Math.floor(car.angle)}
		\nworld: x${Math.floor(car.worldPos.x)}, y${Math.floor(car.worldPos.y)}
		\ncamera: x${Math.floor(camera.position.x)}, y${Math.floor(camera.position.y)}
		\ndirX: ${Math.round(car.dirX * 100) / 100}, dirY: ${Math.round(car.dirY * 100) / 100}
		\ndeltaX: ${Math.round(car.deltaX * 100) / 100}, deltaY: ${Math.round(car.deltaY * 100) / 100}
		\nvelocity: ${Math.floor(car.velocity)}
		\nsteeringAngle: ${Math.floor(car.steeringAngle)}
		\nisAccelerating: ${car.isAccelerating}
		\nisBraking: ${car.isBraking}
		`;
};

//handles keyDown event
const keyDown = (e: KeyboardEvent): void => {
	if (e.code.substring(0, 5) === 'Arrow') {
		keys.set(e.code.substring(5), true); //use rem. of the input event string for key Map index
		e.preventDefault(); //prevent page navigation for arrow keys
	}
};
//handles keyUp event
const keyUp = (e: KeyboardEvent): void => {
	if (e.code.substring(0, 5) === 'Arrow') {
		keys.set(e.code.substring(5), false);
		e.preventDefault();
	}
};
