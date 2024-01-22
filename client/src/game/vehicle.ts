import { Container, Point, Text, TextStyle } from 'pixi.js';
import { MyCircle, MyLine, MyRect } from '../util/gfx';
import { GameObject } from './game_object';
import { Game } from '../game';

export default class Vehicle extends GameObject {
	game: Game; //reference to the passed game instance

	vehicleSettings: Map<string, number> = new Map<string, number>();
	settingNames: Array<string> = [
		'power',
		'weight',
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
		'driveBalance', //0 = front, 1 = rear
		'brakeBalance', //0 = front, 1 = rear
		'tyreGrip',
	];

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

	heading: number = 0;

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

	physics: VehiclePhysics = new VehiclePhysics(this);

	constructor(x: number, y: number, w: number, h: number, game: Game) {
		super(x, y, w, h, './images/car.png', game);
		this.game = game;
		console.log(this.game);
		this.debugGraphics = new VehicleDebug(this);

		//for each name add it to vehicleSettings Map
		for (const setting of this.settingNames) {
			this.vehicleSettings.set(setting, 0);
		}
	}

	/**
	 * Adjusts the steering angle of a vehicle by a specified amount, ensuring
	 * that the angle does not exceed the vehicles maximum steering angle.
	 * @param {number} value - The change in steering angle.
	 */
	ApplySteering(value: number) {
		this.isSteering = true;
		this.steeringAngle += value;
		this.steeringAngle = Math.min(Math.max(this.steeringAngle, -this.GetSetting('maxSteeringAngle')), this.GetSetting('maxSteeringAngle'));
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
	UpdateSetting = (key: string, value: number) => {
		if (this.vehicleSettings.has(key)) this.vehicleSettings.set(key, value);
		else console.log(`ERROR: <vehicle.ts> UpdateSetting ${key} does not exist in vars Map`);
	};

	GetSetting = (key: string): number => {
		const getKey = this.vehicleSettings.get(key);
		if (getKey) return getKey;
		else {
			console.log(`ERROR: <vehicle.ts> GetSetting ${key} does not exist in vars Map`);
			return 0;
		}
	};

	//#region physics vehicle physics tick calculations
	/**
	 * Updates the position and velocity of a vehicle based on various settings and user input.
	 * @param {number} dt - time step, in seconds
	 */
	Tick(dt: number) {
		this.physics.Tick(dt);

		if (!this.isSteering) {
			this.steeringAngle *= 1 - this.GetSetting('steeringRebound') * dt; //reverts the steering angle to center at a constant rate
		}
		this.isBraking = false;
		this.isAccelerating = false;
		this.isSteering = false;

		this.heading += this.physics.yawDelta;
		this.angle = this.heading;
		this.motionVector.set(this.physics.fMomentum * Math.sin(this.heading * (Math.PI / 180)), -this.physics.fMomentum * Math.cos(this.heading * (Math.PI / 180)));
		this.debugGraphics.Update();
		super.Tick(dt);
	}
}

//#region physics

class VehiclePhysics {
	v: Vehicle; //reference to the vehicle physics is applied to
	fMomentum: number = 0; //how much forward force the car has
	fMomentumDelta: number = 0; //how much the forward force is changing
	yawDelta: number = 0; //angle in degrees of change in yaw
	frontAxle: Axle;
	rearAxle: Axle;
	wheels: Array<Wheel> = new Array<Wheel>();

	constructor(v: Vehicle) {
		this.v = v;
		this.frontAxle = new Axle(v, 'f');
		this.rearAxle = new Axle(v, 'r');
		this.wheels[0] = this.frontAxle.leftWheel;
		this.wheels[1] = this.frontAxle.rightWheel;
		this.wheels[2] = this.rearAxle.leftWheel;
		this.wheels[3] = this.rearAxle.rightWheel;
	}
	Tick(dt: number) {
		const vehicleWeight = this.v.GetSetting('weight');
		if (this.v.isAccelerating) {
			const power = this.v.GetSetting('power') * 1000;
			this.DriveVehicle((power / vehicleWeight) * dt); //applies a driving force to the vehicle
		}

		this.EqualizeWheelRotation(); //after applying power
		if (this.v.isBraking) this.Brake(((this.v.GetSetting('brakingForce') * 1000) / vehicleWeight) * dt); //applies a braking force to the vehicle
		this.wheels.forEach((wheel) => {
			wheel.Tick();
		});
		this.Steer(this.v.GetSetting('steeringForce') * 10 * this.v.steeringAngle * dt);
		this.fMomentumDelta = this.CalcFMomentumDelta();
		this.fMomentum += this.fMomentumDelta;
		const resistance = 1 - this.v.GetSetting('resistance') * dt;
		this.fMomentum *= resistance;
	}

	/**
	 * The function calculates the change in momentum for a set of wheels.
	 * @returns the average displacement of the wheels in meters.
	 */
	CalcFMomentumDelta() {
		let displacement = 0;
		this.wheels.forEach((wheel) => {
			displacement += wheel.rotationDelta * wheel.radius * 0.0254;
		});
		//console.log(displacement / 4);
		return displacement / 4;
	}

	EqualizeWheelRotation() {
		let highestRotation = 0;
		this.wheels.forEach((wheel) => {
			if (wheel.rotation > highestRotation) highestRotation = wheel.rotation;
		});
	}

	/** adds forward momentum to the vehicle
	 * @param {number} force - how much energy to move.
	 */
	DriveVehicle(force: number) {
		//console.log('DRIVING FORCE: ' + force);
		const balance = this.v.GetSetting('driveBalance');
		this.rearAxle.DriveAxle(force * balance);
		this.frontAxle.DriveAxle(force * (1 - balance));
	}

	/** adds forward momentum to the vehicle
	 * @param {number} force - how much energy to move.
	 */
	Brake(force: number) {
		const balance = this.v.GetSetting('brakeBalance');
		this.rearAxle.BrakeAxle(force * balance);
		this.frontAxle.BrakeAxle(force * (1 - balance));
		//console.log(this.momentum);
	}

	Steer(angle: number) {
		this.yawDelta = angle * this.fMomentum * 5;
		//console.log(this.yawDelta);
	}
}

class Axle {
	v: Vehicle; //the vehicle this belongs to
	leftWheel: Wheel;
	rightWheel: Wheel;

	constructor(v: Vehicle, vpos: string) {
		this.v = v;
		this.leftWheel = new Wheel(this.v, vpos, 'l');
		this.rightWheel = new Wheel(this.v, vpos, 'r');
	}

	DriveAxle(force: number) {
		this.leftWheel.DriveWheel(force);
		this.rightWheel.DriveWheel(force);
	}

	BrakeAxle(force: number) {
		this.leftWheel.BrakeWheel(force);
		this.rightWheel.BrakeWheel(force);
	}
}

class Wheel {
	v: Vehicle; //the vehicle this belongs to
	radius: number = 17;
	width: number = 0;
	torque: number = 0; //rotational force
	rotation: number = 0;
	rotationDelta: number = 0;
	slip: number = 0;
	load: number = 0;
	overSlipLimit: boolean = false;
	pos: string;

	constructor(v: Vehicle, vpos: string, hpos: string) {
		this.v = v;
		this.pos = vpos + hpos;
	}
	DriveWheel(force: number) {
		this.torque = force * this.radius * 0.0254; // torque = force × radius in meters
	}
	Tick() {
		this.rotationDelta = this.CalcAngularDisplacement(this.radius, this.torque, this.v.GetSetting('weight') / 4);
		this.rotation += this.rotationDelta;
		this.torque = 0;
	}
	BrakeWheel(force: number) {
		this.torque = -force;
	}

	CalcAngularDisplacement(radius: number, torque: number, massInKilograms: number) {
		const momentOfInertia = 0.5 * massInKilograms * Math.pow(radius * 0.0254, 2); // moment of inertia  = 0.5 × Mass × meterRadius^2
		const angularDisplacement = torque / momentOfInertia;
		//console.log(angularDisplacement);
		return angularDisplacement;
	}
}

//#endregion

//#region debug container for debugging the load

class VehicleDebug extends Container {
	vehicle: Vehicle;
	steeringAngle: MyLine = new MyLine(100, 2, 0xffffff);
	vehLoad: MyCircle = new MyCircle(10, 0xffffff);
	loadText: Text = new Text('hello World', new TextStyle({ fontSize: 12, fill: 0xffffff }));
	wheels: Array<MyRect> = new Array<MyRect>();

	constructor(v: Vehicle) {
		super();
		this.vehicle = v;
		this.addChild(new MyRect(100, 100, 0x000000));
		this.addChild(this.loadText);
		this.addChild(this.steeringAngle);
		this.addChild(this.vehLoad);
		this.steeringAngle.scale.set(0.5);
		this.vehLoad.scale.set(0.5);
		this.position.set(v.game.renderer.width - 50, v.game.renderer.height - 50);
		for (let i = 0; i < 4; i++) {
			this.wheels.push(new MyRect(12, 20, 0xffffff));
			this.wheels[i].position.set(i * 20 - (i % 2) * 20 - 20, (i % 2) * 40 - 20);
			this.addChild(this.wheels[i]);
		}
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
