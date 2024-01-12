import { Application, Container, ICanvas, Transform } from 'pixi.js';
import { GameObject } from './game_object';

export class Camera extends Transform {
	private followTarget: GameObject | null;
	private app: Application;

	constructor(app: Application) {
		super();
		this.followTarget = null;
		this.app = app;
	}

	UpdatePos() {
		if (this.followTarget)
			this.position.set(
				this.followTarget.worldPos.x - this.app.renderer.width / 2,
				this.followTarget.worldPos.y - this.app.renderer.height / 2
			);
	}

	FollowObject(obj: GameObject) {
		this.followTarget = obj;
		this.UpdatePos();
	}
}
