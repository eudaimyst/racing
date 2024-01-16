import { ColorSource, Container, Graphics, Point, Text, TextStyle } from 'pixi.js';
import { Camera } from './camera';
import { GameObject } from './game_object';
import { Game } from '../game';

const vehicleSettings: Map<string, any> = new Map<string, any>();
const settingNames: Array<string> = [
	'power',
	'brakingForce',
	'resistance',
	'steeringForce',
	'maxSteeringAngle',
	'steeringRate',
	'steeringRebound',
	'loadFactorPosY',
	'loadFactorNegY',
	'loadChangeRate',
	'slipLimit',
];
//for each name add it to vehicleSettings Map
for (let i = 0; i < settingNames.length; i++) {
	vehicleSettings.set(settingNames[i], 0);
}

const DrawLine = (width: number, color: ColorSource) => {
	const line = new Graphics();
	line.lineStyle(width, color);
	line.moveTo(0, 0);
	line.lineTo(0, -100);
	line.endFill();
	return line;
};

class Rect extends Graphics {
	w: number;
	h: number;
	constructor(w: number, h: number, color: ColorSource) {
		super();
		this.w = w;
		this.h = h;
		this.beginFill(color);
		this.drawRect(-w / 2, -h / 2, w, h);
		this.endFill();
	}
	SetColor(color: ColorSource) {
		this.clear();
		this.beginFill(color);
		this.drawRect(-this.w / 2, -this.h / 2, this.w, this.h);
		this.endFill();
	}
}

class Circle extends Graphics {
	radius: number;
	constructor(radius: number, color: ColorSource) {
		super();
		this.radius = radius;
		this.beginFill(color);
		this.drawCircle(0, 0, radius);
		this.endFill();
	}
	SetColor(color: ColorSource) {
		this.clear();
		this.beginFill(color);
		this.drawCircle(0, 0, this.radius);
		this.endFill();
	}
}

//#region debug container for debugging the load
const overloadValue: number = 15; //point at which debug squares turn red for vehicle load

class VehicleDebug extends Container {
	vehicle: Vehicle;
	steeringAngle: Graphics = DrawLine(2, 0xff0000);
	vehLoad: Circle = new Circle(10, 0xffffff);
	loadText: Text = new Text('hello World', new TextStyle({ fontSize: 12, fill: 0xffffff }));

	constructor(v: Vehicle) {
		super();
		this.vehicle = v;
		this.addChild(new Rect(100, 100, 0x000000));
		this.addChild(this.loadText);
		this.addChild(this.steeringAngle);
		this.addChild(this.vehLoad);
		this.steeringAngle.scale.set(0.5);
		this.vehLoad.scale.set(0.5);
		this.position.set(v.game.renderer.width - 50, v.game.renderer.height - 50);
		//this object is added to the stage by the game
	}

	Update() {
		this.steeringAngle.angle = this.vehicle.steeringAngle;
		this.loadText.text = `x: ${Math.floor(this.vehicle.load.x)}\ny: ${Math.floor(this.vehicle.load.y)}`;
		this.loadText.position.set(-this.loadText.width / 2, -50);
		this.vehicle.overSlipLimit ? this.vehLoad.SetColor(0xff0000) : this.vehLoad.SetColor(0xffffff);
		//console.log(this.vehicle.load);
		this.vehLoad.position.set(this.vehicle.load.x, this.vehicle.load.y);
	}
}

//#endregion

export default class Vehicle extends GameObject {
	game: Game; //reference to the passed game instance
	//variables, set by input / simulation
	steeringAngle: number = 0; //-ve is left, +ve is right
	brakeValue: number = 0; //analog
	accelValue: number = 0; //analog
	forwardM: number = 0; //the forward power being applied to the vehicle
	oldForwardM: number = 0; //previous frames forwardM for calculating delta
	momentumDelta: number = 0; //the change in momentum, updated per tick
	velocity: number = 0; //m/s
	isAccelerating: boolean = false;
	isBraking: boolean = false;
	isSteering: boolean = false;
	debugGraphics: VehicleDebug;
	overSlipLimit: boolean = false;

	rollingResistance: number = 0;

	rearSlip: number = 0;
	frontSlip: number = 0;
	slipAmount: number = 0;
	frontSlipAngle: number = 0;

	load: Point = new Point(0, 0);
	loadHistory: Array<Point> = [];
	loadDelta: Point = new Point(0, 0);

	slip: Point = new Point(0, 0);

	momentum: Point = new Point(0, 0);
	momentumUnit: Point = new Point(0, 0);

	oldMotionVector: Point = new Point(0, 0);
	newMotionVector: Point = new Point(0, 0);

	constructor(x: number, y: number, w: number, h: number, game: Game) {
		super(x, y, w, h, './images/car.png', game);
		this.game = game;
		console.log(this.game);
		this.debugGraphics = new VehicleDebug(this);
	}

	/**
	 * Adjusts the steering angle of a vehicle by a specified amount, ensuring
	 * that the angle does not exceed the vehicles maximum steering angle.
	 * @param {number} value - The change in steering angle.
	 */
	ApplySteering(value: number) {
		this.isSteering = true;
		this.steeringAngle += value;
		this.steeringAngle = Math.min(Math.max(this.steeringAngle, -vehicleSettings.get('maxSteeringAngle')), vehicleSettings.get('maxSteeringAngle'));
	}

	/**
	 * Increases velocity by power when true
	 */
	ApplyAccelerator(value: number) {
		this.isAccelerating = true;
		this.accelValue = value;
	}

	/**
	 * Reduces velocity when true
	 */
	ApplyBrake(value: number) {
		this.isBraking = true;
		this.brakeValue = value;
	}

	/**
	 * Updates a value in the `vehicleSettings` map if the specified key exists, otherwise logs an error message.
	 * @param {string} key - the key of the setting to be upadted in the vehicleSettings Map.
	 * @param {any} value - Represents the new value to be assigned.
	 */
	UpdateSetting = (key: string, value: any) => {
		if (vehicleSettings.has(key)) vehicleSettings.set(key, value);
		else console.log(`ERROR: <vehicle.ts> ${key} does not exist in vars Map`);
	};

	GetSetting = (key: string) => {
		return vehicleSettings.get(key);
	};

	//#region physics vehicle physics tick calculations
	/**
	 * Updates the position and velocity of a vehicle based on various settings and user input.
	 * @param {number} dt - time step, in seconds
	 */
	Tick(dt: number) {
		this.slipAmount = Math.min(1, this.rearSlip / 15);
		this.slipAmount = Math.min(1, this.rearSlip / 15);
		//input related, variables set by game input events
		if (this.isBraking) this.forwardM = Math.max(0, this.forwardM - this.brakeValue * this.GetSetting('brakingForce') * dt); //reduces the momentum by the braking force
		if (this.isAccelerating) this.forwardM += this.accelValue * this.GetSetting('power') * dt; //increases the momentum by the vehicles power
		if (!this.isSteering) this.steeringAngle *= 1 - this.GetSetting('steeringRebound') * dt; //reverts the steering angle to center at a constant rate

		this.rollingResistance = this.GetSetting('resistance') * dt;
		this.forwardM *= 1 - this.rollingResistance; //slows down the vehicle at a constant rate

		this.load.x > 0 ? (this.rearSlip = -this.rearSlip * 2) : (this.rearSlip = this.rearSlip * 2); //this multiplies the slipping effect in the direction of steering
		//**IMPORTANT: The container of the game object is rotated here, not at the end of the tick */
		this.angle += (this.steeringAngle + this.rearSlip) * this.GetSetting('steeringForce') * this.forwardM * dt; //multiply steering angle by the forward momentum to prevent rotating when stopped

		console.log(this.rearSlip, this.slipAmount, this.angle);
		//**IMPORTANT: The motion vector is used by the game_object tick to adjust the objects position */
		let degOffset90 = Math.PI / 2;
		this.motionVectorUnit.set(Math.cos((this.angle - this.rearSlip * 2) * (Math.PI / 180) - degOffset90), Math.sin((this.angle - this.rearSlip * 2) * (Math.PI / 180) - degOffset90)); //convert the rotation of the vehicle to a unit vector

		this.newMotionVector.copyFrom(this.motionVectorUnit.multiplyScalar(this.forwardM * dt)); //multiply the vector by the momentum calculated to get the motion vector
		this.motionVector.copyFrom(this.oldMotionVector.multiplyScalar(this.slipAmount * (1 - this.rollingResistance * 2)).add(this.newMotionVector.multiplyScalar(1 - this.slipAmount)));
		this.oldMotionVector.copyFrom(this.motionVector);

		//load is calculated here, used for slip later
		this.momentumDelta = -(this.oldForwardM - this.forwardM) * Math.pow(10, 2.1); //the difference in momentum between frames, then multiplied by a factor to be usable in load calculations
		this.oldForwardM = this.forwardM; //store the current forward momentum for the next frames delta calculation
		this.loadDelta.y = (this.momentumDelta + this.forwardM * 0.25) * (1 + this.slipAmount); //the addition of the forwardM accounts for load on the rear wheels due to drive
		this.loadDelta.x = (-this.steeringAngle / 90) * this.forwardM * (1 + this.slipAmount); //just multiply steering angle by speed for horizontal load
		//load smoothing
		const loadChangeFrames = this.GetSetting('loadChangeRate') / dt; //smooth the load value over this many frames
		if (this.loadHistory.length > loadChangeFrames) this.loadHistory.pop(); //drop the remaining entries in the array if the loadChangeFrame value changes (either due to framerate or setting change)
		//console.log(`${this.GetSetting('loadChangeRate')} / ${dt} = ${loadChangeFrames}`);
		if (this.loadHistory.push(new Point().copyFrom(this.loadDelta)) > loadChangeFrames) this.loadHistory.shift(); //add the latest load delta value and shift the array if over the frame count
		const t: Point = new Point(0, 0); //temporary point used for calculating average
		this.loadHistory.forEach(function (item) {
			t.copyFrom(t.add(item)); //add all the current values in the array to the t point
		});
		this.load.copyFrom(t.multiplyScalar(1 / this.loadHistory.length)); //this averages them out

		//slip limit
		if (this.load.magnitude() > this.GetSetting('slipLimit')) {
			this.overSlipLimit = true;
			this.slip.copyFrom(this.load.normalize());
			this.slip.y < 0 ? (this.frontSlip = this.load.magnitude() - this.GetSetting('slipLimit')) : (this.rearSlip = this.load.magnitude() - this.GetSetting('slipLimit')); //set the front and rear slip values
			//.log(this.frontSlip);
		} else {
			this.overSlipLimit = false;
			this.slip.set(0, 0);
			this.frontSlip = 0;
			this.rearSlip = 0;
		}

		this.velocity = (this.motionVector.magnitude() / dt) * 3.6; //convert m/s to km/h

		this.isBraking = false;
		this.isAccelerating = false;
		this.isSteering = false;

		this.debugGraphics.Update();
		super.Tick(dt);
	}

	//#endregion
}
