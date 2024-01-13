import { Sprite, Container, Texture, ObservablePoint, Point } from 'pixi.js';
import { Camera } from './camera';
import '@pixi/math-extras';

export class GameObject extends Container {
	private sprite: Sprite;
	private camera: Camera;
	worldPos: ObservablePoint;
	motionVector: ObservablePoint;
	motionVectorUnit: Point;

	/**
	 * This function creates a sprite object with a specified width and height, sets its anchor point, and
	 * adds it as a child to the current object.
	 * @param {number} w - The parameter `w` represents the width of the sprite.
	 * @param {number} h - The parameter `h` represents the height of the sprite.
	 * @param {string} path - The parameter `path` represents the path to the image file.
	 */
	constructor(x: number, y: number, w: number, h: number, path: string, camera: Camera) {
		super();
		this.camera = camera;
		this.worldPos = new ObservablePoint(() => {}, this);
		this.motionVector = new ObservablePoint(() => {}, this);
		this.motionVectorUnit = new Point();
		this.worldPos.set(x, y);
		this.sprite = new Sprite(Texture.from(path));
		this.sprite.width = w || 50;
		this.sprite.height = h || 50;
		this.sprite.anchor.set(0.5);
		this.addChild(this.sprite);
	}

	// Updates the position of an object relative to the camera's position.
	private UpdatePos() {
		this.position.set(this.worldPos.x - this.camera.position.x, this.worldPos.y - this.camera.position.y);
	}

	MoveBy(x: number, y: number) {
		this.worldPos.set(this.worldPos.x + x, this.worldPos.y + y);
	}

	MoveTo(x: number, y: number) {
		this.worldPos.set(x, y);
	}

	Tick(dt: number) {
		this.MoveBy(this.motionVector.x, this.motionVector.y);
		this.UpdatePos();
	}
}
