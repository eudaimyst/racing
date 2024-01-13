import { Camera } from './camera';
import { GameObject } from './game_object';

const vehicleSettings: Map<string, any> = new Map<string, any>();
vehicleSettings.set('maxSteeringAngle', 90);
vehicleSettings.set('steeringRate', 3);
vehicleSettings.set('power', 100); //increases thrust by this rate
vehicleSettings.set('brakingForce', 10); //slows velocity by this rate
vehicleSettings.set('resistance', 1); //rolling resistance (TODO: Multiply by surface friction)
vehicleSettings.set('steeringRebound', 5);

export default class Vehicle extends GameObject {
	//variables, set by input / simulation
	steeringAngle: number = 0; //-ve is left, +ve is right
	isBraking: boolean = false;
	isAccelerating: boolean = false;
	thrust: number = 0; //increases velocity
	velocity: number = 0; //m/s
	dirX: number = 0;
	dirY: number = 0;
	deltaX: number = 0;
	deltaY: number = 0;

	constructor(x: number, y: number, w: number, h: number, camera: Camera) {
		super(x, y, w, h, './images/car.png', camera);
	}

	/**
	 * Adjusts the steering angle of a vehicle by a specified amount, ensuring
	 * that the angle does not exceed the vehicles maximum steering angle.
	 * @param {number} value - The change in steering angle.
	 */
	ApplySteering(value: number) {
		this.steeringAngle += value;
		this.steeringAngle = Math.min(
			Math.max(this.steeringAngle, -vehicleSettings.get('maxSteeringAngle')),
			vehicleSettings.get('maxSteeringAngle')
		);
	}

	/**
	 * Increases thrust by a specified value, multiplied by power of vehicle.
	 * @param {number} value - Min: 0, Max: 1
	 */
	ApplyAccelerator() {
		this.isAccelerating = true;
	}

	/**
	 * Reduces the velocity of an object by applying a braking force, linear (for now).
	 */
	ApplyBrake() {
		this.isBraking = true;
	}

	/**
	 * Updates a value in the `vehicleSettings` map if the specified key exists, otherwise logs an error message.
	 * @param {string} key - the key of the setting to be upadted in the vehicleSettings Map.
	 * @param {any} value - Represents the new value to be assigned.
	 */
	updateSetting(key: string, value: any) {
		if (vehicleSettings.has(key)) vehicleSettings.set(key, value);
		else console.log(`ERROR: <vehicle.ts> ${key} does not exist in vars Map`);
	}

	/**
	 * Updates the position and velocity of a vehicle based on various settings and user input.
	 * @param {number} dt - time step, in seconds
	 */
	Tick(dt: number) {
		if (this.isBraking && this.velocity > 0) this.velocity -= vehicleSettings.get('brakingForce'); //reduces the velocity by the braking force
		if (this.isAccelerating) this.velocity += vehicleSettings.get('power') * 10 * dt; //increases the velocity by the vehicles power

		this.angle += this.steeringAngle * (this.velocity / 500) * vehicleSettings.get('steeringRate') * dt; //rotates the vehicles angle by the

		this.velocity *= 1 - vehicleSettings.get('resistance') * dt; //slows down the vehicle at a constant rate
		this.steeringAngle *= 1 - vehicleSettings.get('steeringRebound') * dt; //reverts the steering angle to center at a constant rate

		//adjust position of vehicle
		this.dirX = Math.cos(this.rotation - Math.PI / 2); //minus 90 degrees as default points right
		this.dirY = Math.sin(this.rotation - Math.PI / 2);
		this.deltaX = this.dirX * this.velocity * dt;
		this.deltaY = this.dirY * this.velocity * dt;

		this.MoveBy(this.deltaX, this.deltaY);
		this.UpdatePos();
		this.isBraking = false;
		this.isAccelerating = false;
	}
}
