import { Camera } from './camera';
import { GameObject } from './game_object';

const vars: Map<string, any> = new Map<string, any>();
vars.set('maxSteeringAngle', 90);
vars.set('steeringRate', 3);
vars.set('power', 10); //increases thrust by this rate
vars.set('brakingForce', 10); //slows velocity by this rate
vars.set('resistance', 1); //rolling resistance (TODO: Multiply by surface friction)
vars.set('steeringRebound', 5);

export default class Vehicle extends GameObject {
	//variables, set by input / simulation
	steeringAngle: number = 0; //-ve is left, +ve is right
	thrust: number = 0; //increases velocity
	velocity: number = 0; //m/s
	braking: boolean = false;

	constructor(x: number, y: number, w: number, h: number, camera: Camera) {
		super(x, y, w, h, './images/car.png', camera);
	}

	/**
	 * Adjusts the steering angle of a vehicle by a specified amount, ensuring
	 * that the angle does not exceed the vehicles maximum steering angle.
	 * @param {number} value - The change in steering angle.
	 */
	AddSteering(value: number) {
		this.steeringAngle += value;
		this.steeringAngle = Math.min(
			Math.max(this.steeringAngle, -vars.get('maxSteeringAngle')),
			vars.get('maxSteeringAngle')
		);
	}

	UpdateVar(str: string, value: any) {
		vars.set(str, value);
	}

	/**
	 * Increases thrust by a specified value, multiplied by power of vehicle.
	 * @param {number} value - Min: 0, Max: 1
	 */
	AddThrust(value: number) {
		this.thrust = vars.get('power');
	}

	/**
	 * Reduces the velocity of an object by applying a braking force, linear (for now).
	 */
	ApplyBrakes() {
		this.braking = true;
	}

	Tick(dt: number) {
		this.velocity += this.thrust * 10 * dt;
		this.velocity *= 1 - vars.get('resistance') * dt;
		this.steeringAngle *= 1 - vars.get('steeringRebound') * dt;
		if (this.braking) this.velocity = Math.max(0, this.velocity - vars.get('brakingForce'));

		//rotate by steering angle
		this.angle += this.steeringAngle * (this.velocity / 500) * vars.get('steeringRate') * dt;

		//adjust position of vehicle
		let dx = Math.cos(this.rotation - Math.PI / 2); //minus 90 degrees as default points right
		let dy = Math.sin(this.rotation - Math.PI / 2);

		this.MoveBy(dx * this.velocity * dt, dy * this.velocity * dt);

		this.UpdatePos();
		this.braking = false;
		this.thrust = 0;
	}
}

/* 	if (keys.get('Left')) {
		//obj.x -= speed * dt;
		car.angle -= (speed / 2) * dt;
	}
	if (keys.get('Right')) {
		//obj.x += speed * dt;
		car.angle += (speed / 2) * dt;
	}
	if (keys.get('Up')) {
	}
	if (keys.get('Down')) {
		let dx = Math.cos(car.rotation - Math.PI / 2);
		let dy = Math.sin(car.rotation - Math.PI / 2);
		car.MoveBy(dx * -speed * dt, dy * -speed * dt);
	} */
