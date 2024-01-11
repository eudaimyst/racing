import { Transform } from 'pixi.js';
import * as Debug from '../debug.js';

/**
 *
 *
 * @export
 * @class Camera
 */
export default class Camera extends Transform {
	zoom;
	objectTarget;
	width;
	height;

	constructor(x, y) {
		super();
		//this.width = w; this.height = h;
		this.position.set(x, y);

		return this;
	}

	Assign(objectTarget) {
		this.objectTarget = objectTarget;
	}

	SetZoom(zoom) {
		this.zoom = zoom;
	}

	MoveBy(x, y) {
		this.position.set(Math.round(this.position.x + x), Math.round(this.position.y + y));
	}
	MoveTo(x, y) {
		this.position.set(Math.round(x), Math.round(y));
	}

	Tick() {
		if (this.objectTarget) this.MoveTo(this.objectTarget.worldPosition.x, this.objectTarget.worldPosition.y);
		Debug.Log(this.position.x + ',' + this.position.y);
	}
}
