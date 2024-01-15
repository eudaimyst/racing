import { Application, Transform } from 'pixi.js';
import { GameObject } from './game_object';

export class Camera extends Transform {
	private followTarget: GameObject | null;
	private app: Application;
	zoom: number = 20;

	constructor(app: Application) {
		super();
		this.followTarget = null;
		this.app = app;
	}

	UpdatePos() {
		const zoomFactor: number = 100 / this.zoom;
		if (this.followTarget) {
			const t: GameObject = this.followTarget;
			this.position.set(t.worldPos.x - (this.app.renderer.width / 2) * zoomFactor, t.worldPos.y - (this.app.renderer.height / 2) * zoomFactor);
		}
	}

	SetFollowTarget(obj: GameObject) {
		this.followTarget = obj;
		this.UpdatePos();
	}

	UpdateSetting = (setting: any, value: any) => {
		//we ignore the setting variable because the only setting we have for now is zoom
		this.zoom = value;
		this.UpdatePos();
	};
	GetFollowTarget(): GameObject | null {
		return this.followTarget;
	}
}
