/* eslint-disable @typescript-eslint/no-this-alias */
import { Application, ObservablePoint, Text, TextStyle, Ticker } from 'pixi.js';
import { Camera } from './game/camera.ts';
import Vehicle from './game/vehicle.ts';
import TouchControl from './game/touch_control.ts';
import { Track } from './game/track.ts';

const keys: Map<string, boolean> = new Map<string, boolean>();
let game: Game;
let car: Vehicle;
let track: Track;
let camera: Camera;

const style = new TextStyle({
	fontSize: 12,
	lineHeight: 6,
	fill: '#ffffff',
});
const debugText: Text = new Text('', style);

export class Game extends Application {
	//used to pass values from html
	carUpdateSetting;
	camUpdateSetting;

	pointerPos: ObservablePoint;
	pointerDownPos: ObservablePoint;
	pointerDown: boolean = false;
	touchControl: TouchControl = new TouchControl();
	constructor() {
		super({
			backgroundColor: '#8888DD',
			width: 1000,
			height: 1000,
		});
		game = this;
		document.addEventListener('keydown', keyDown);
		document.addEventListener('keyup', keyUp);

		camera = new Camera(this);
		car = new Vehicle(0, 0, 4.8, 4.8, this);
		//track = new GameObject(0, 0, 400, 400, './images/track.png', this);
		track = new Track(this);
		this.carUpdateSetting = car.UpdateSetting;
		this.camUpdateSetting = camera.UpdateSetting;
		this.pointerPos = new ObservablePoint(() => {}, this);
		this.pointerDownPos = new ObservablePoint(() => {}, this);
		this.stage.eventMode = 'static';

		this.stage.addEventListener('pointermove', (e) => {
			this.pointerPos.set(e.global.x, e.global.y);
			if (this.pointerDown) this.touchControl.UpdateTouch(this.pointerPos.x, this.pointerPos.y);
		});

		this.stage.on('pointerdown', (e) => {
			this.pointerPos.set(e.global.x, e.global.y);
			this.pointerDownPos.set(e.global.x, e.global.y);
			this.touchControl.StartTouch(this.pointerPos.x, this.pointerPos.y);
			this.pointerDown = true;
		});

		this.stage.on('pointerup', () => {
			this.pointerDown = false;
			this.touchControl.EndTouch();
		});

		this.stage.addChild(track);
		this.stage.addChild(car);
		this.stage.addChild(debugText);
		this.stage.addChild(this.touchControl);
		this.stage.addChild(car.debugGraphics);
		camera.SetFollowTarget(car);

		Ticker.shared.add(Tick);
	}

	GetCamera = () => {
		return camera;
	};
}

/**
 * Updates position and movement of car based on user input and updates debug texts.
 */
const Tick = () => {
	const dt = Ticker.shared.deltaMS * 0.001;
	track.Tick(dt);
	car.Tick(dt);
	//camera.UpdatePos();

	if (keys.get('Left')) {
		car.ApplySteering(-1);
	}
	if (keys.get('Right')) {
		car.ApplySteering(1);
	}
	if (keys.get('Up')) {
		car.ApplyAccelerator(1);
	}
	if (keys.get('Down')) {
		car.ApplyBrake(1);
	}

	if (game.touchControl.steer !== 0) {
		car.ApplySteering(game.touchControl.steer);
	}
	if (game.touchControl.power > 0) {
		car.ApplyAccelerator(game.touchControl.power);
	}
	if (game.touchControl.power < 0) {
		car.ApplyBrake(-game.touchControl.power);
	}

	//debug text for basic vehicle movement
	debugText.text = `stage: x${Math.floor(car.x)}, y${Math.floor(car.y)}, ${Math.floor(car.angle)}
		\nworld: x${Math.floor(car.worldPos.x)}, y${Math.floor(car.worldPos.y)}
		\ncamera: x${Math.floor(camera.position.x)}, y${Math.floor(camera.position.y)}
		\nmotionX: ${Math.round(car.motionVector.x * 100) / 100}, dirY: ${Math.round(car.motionVector.y * 100) / 100}
		\nmotionUnitX: ${Math.round(car.motionVectorUnit.x * 100) / 100}, deltaY: ${Math.round(car.motionVectorUnit.y * 100) / 100}
		\nthrust: ${Math.floor(car.forwardM)}
		\nvelocity: ${Math.floor(car.velocity)}
		\nsteeringAngle: ${Math.floor(car.steeringAngle)}
		\nisAccelerating: ${car.isAccelerating}
		\nisBraking: ${car.isBraking}
		\n---------------------------------
		\npointerPos: x${Math.floor(game.pointerPos.x)}, y${Math.floor(game.pointerPos.y)}
		\npointerDownPos: x${Math.floor(game.pointerDownPos.x)}, y${Math.floor(game.pointerDownPos.y)}
		\npointerDown: ${game.pointerDown}
		\ntouchPower${Math.floor(game.touchControl.power * 100) / 100}
		\ntouchSteer${Math.floor(game.touchControl.steer * 100) / 100}
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
