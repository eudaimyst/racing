import { ColorSource, Container, Graphics, Point } from 'pixi.js';
import { Camera } from './camera';
import { GameObject } from './game_object';

const vehicleSettings: Map<string, any> = new Map<string, any>();
vehicleSettings.set('maxSteeringAngle', 90);
vehicleSettings.set('steeringRate', 3);
vehicleSettings.set('power', 100); //increases velocity by this rate
vehicleSettings.set('brakingForce', 10); //slows velocity by this rate
vehicleSettings.set('resistance', 1); //rolling resistance (TODO: Multiply by surface friction)
vehicleSettings.set('steeringRebound', 15);
vehicleSettings.set('slipFactor', 1);

const DrawLine = (width: number, color: ColorSource) => {
	const line = new Graphics();
	line.lineStyle(width, color);
	line.moveTo(0, 0);
	line.lineTo(0, -100);
	line.endFill();
	return line;
};

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

const overLoadValueX: number = 40; //point at which debug squares turn red for vehicle load
const overLoadValueY: number = 50; //point at which debug squares turn red for vehicle load

class VehicleDebug extends Container {
	vehicle: Vehicle;
	steeringAngle: Graphics = DrawLine(2, 0xff0000);
	vehLoad: Circle = new Circle(10, 0xffffff);

	constructor(v: Vehicle) {
		super();
		this.vehicle = v;
		this.addChild(this.steeringAngle);
		this.addChild(this.vehLoad);
		console.log('hello');
		v.addChild(this);
		this.scale.set(0.01);
	}

	Update() {
		this.steeringAngle.angle = this.vehicle.steeringAngle;
		let overload: boolean = false;
		if (this.vehicle.load.x > overLoadValueX || this.vehicle.load.x < -overLoadValueX) overload = true;
		if (this.vehicle.load.y > overLoadValueY || this.vehicle.load.y < -overLoadValueY) overload = true;
		overload ? this.vehLoad.SetColor(0xff0000) : this.vehLoad.SetColor(0xffffff);
		this.vehLoad.position.set(this.vehicle.load.x, this.vehicle.load.y);
	}
}

export default class Vehicle extends GameObject {
	//variables, set by input / simulation
	steeringAngle: number = 0; //-ve is left, +ve is right
	brakeValue: number = 0; //analog
	accelValue: number = 0; //analog
	velocity: number = 0; //m/s
	dirX: number = 0;
	dirY: number = 0;
	deltaX: number = 0;
	deltaY: number = 0;
	isAccelerating: boolean = false;
	isBraking: boolean = false;
	isSteering: boolean = false;
	debugGraphics: VehicleDebug = new VehicleDebug(this);

	rearSlip: number = 0;
	frontSlip: number = 0;

	load: Point = new Point(0, 0);
	momentum: Point = new Point(0, 0);
	momentumUnit: Point = new Point(0, 0);

	constructor(x: number, y: number, w: number, h: number, camera: Camera) {
		super(x, y, w, h, './images/car.png', camera);
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

	/**
	 * Updates the position and velocity of a vehicle based on various settings and user input.
	 * @param {number} dt - time step, in seconds
	 */
	Tick(dt: number) {
		let velChange = this.velocity;
		if (this.isBraking && this.velocity > 0) this.velocity -= this.brakeValue * this.GetSetting('brakingForce'); //reduces the velocity by the braking force
		if (this.isAccelerating) this.velocity += this.accelValue * this.GetSetting('power') * 10 * dt; //increases the velocity by the vehicles power
		if (!this.isSteering) this.steeringAngle *= 1 - this.GetSetting('steeringRebound') * dt; //reverts the steering angle to center at a constant rate

		this.angle += this.steeringAngle * (this.velocity / 500) * dt;

		this.velocity *= 1 - this.GetSetting('resistance') * dt; //slows down the vehicle at a constant rate

		velChange = this.velocity - velChange;
		//adjust position of vehicle
		this.motionVectorUnit.set(Math.cos(this.rotation - Math.PI / 2), Math.sin(this.rotation - Math.PI / 2));
		this.motionVector = this.motionVectorUnit.multiplyScalar(this.velocity * dt);
		this.load.y = (((velChange * 20 + this.velocity / 20) / 2) * this.velocity) / 800;
		this.load.x = ((-this.steeringAngle / 90) * this.velocity) / 10;

		this.debugGraphics.Update();

		this.isBraking = false;
		this.isAccelerating = false;
		this.isSteering = false;

		super.Tick(dt);
	}
}
