import { Sprite, Container, Texture, Transform, ObservablePoint } from 'pixi.js';
import { Camera } from './camera';

export class GameObject extends Container {
	private sprite: Sprite;
	public worldPos: ObservablePoint;
	private camera: Camera;

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
		this.worldPos.set(x, y);
		this.sprite = new Sprite(Texture.from(path));
		this.sprite.width = w || 50;
		this.sprite.height = h || 50;
		this.sprite.anchor.set(0.5);
		this.addChild(this.sprite);
	}

	UpdatePos() {
		this.position.set(this.worldPos.x - this.camera.position.x, this.worldPos.y - this.camera.position.y);
	}

	MoveBy(x: number, y: number) {
		this.worldPos.set(this.worldPos.x + x, this.worldPos.y + y);
	}

	MoveTo(x: number, y: number) {
		this.worldPos.set(x, y);
	}
}
