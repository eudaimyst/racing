import { Container, Graphics } from 'pixi.js';

const bgCircle = new Graphics();
const controlCircle = new Graphics();
export default class TouchControl extends Container {
	power: number = 0;
	steer: number = 0;
	constructor() {
		super();
		bgCircle.beginFill(0x000000);
		bgCircle.alpha = 0.3;
		bgCircle.drawCircle(0, 0, 100);
		bgCircle.endFill();
		controlCircle.beginFill(0x000000);
		controlCircle.alpha = 0.7;
		controlCircle.drawCircle(0, 0, 30);
		controlCircle.endFill();
		this.addChild(bgCircle);
		this.addChild(controlCircle);
		this.visible = false;
	}

	StartTouch(x: number, y: number) {
		this.position.set(x, y);
		controlCircle.position.set(x - this.position.x, y - this.position.y);
		this.visible = true;
	}

	UpdateTouch(x: number, y: number) {
		const dx = x - this.position.x;
		const dy = y - this.position.y;
		this.power = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		this.steer = (180 / Math.PI) * Math.atan2(dy, dx) + 90;
		if (this.power > 100) {
			this.power = 100;
			const tx = this.position.x + Math.cos((this.steer - 90) / (180 / Math.PI)) * 100;
			const ty = this.position.y + Math.sin((this.steer - 90) / (180 / Math.PI)) * 100;
			controlCircle.position.set(tx - this.position.x, ty - this.position.y);
		} else {
			controlCircle.position.set(dx, dy);
		}
		if (this.steer > 120 && this.steer < 251) {
			this.power = -this.power;
		}
		if (this.steer > 90 && this.steer < 271) {
			this.steer = -(this.steer - 180);
		}
		if (this.steer)
			//as the last step, normalise the values
			this.power = this.power / 100;
		this.steer = this.steer / 90;
	}

	EndTouch() {
		this.power = 0;
		this.steer = 0;
		this.visible = false;
	}
}
