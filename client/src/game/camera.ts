import { Application, ObservablePoint, Point, Transform } from 'pixi.js';
import { GameObject } from './game_object';

export class Camera extends Transform {
	private followTarget: GameObject | null;
	private app: Application;
	zoom: number = 20;
	zoomOffset: Point = new Point();

	constructor(app: Application) {
		super();
		this.followTarget = null;
		this.app = app;
	}

	UpdatePos() {
		if (this.followTarget) {
			this.zoomOffset.set(this.app.renderer.width / 2 / this.zoom, this.app.renderer.height / 2 / this.zoom);
			this.position = this.followTarget.worldPos.clone().subtract(this.zoomOffset) as ObservablePoint;
		}
	}

	SetFollowTarget(obj: GameObject) {
		this.followTarget = obj;
		this.UpdatePos();
	}

	UpdateSetting = (setting: string, value: number) => {
		//we ignore the setting variable because the only setting we have for now is zoom
		this.zoom = value;
		this.UpdatePos();
	};
	GetFollowTarget(): GameObject | null {
		return this.followTarget;
	}
}
