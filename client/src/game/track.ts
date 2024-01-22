import { Container } from 'pixi.js';
import { MyRect, MyShape } from '../util/gfx';
import { Game } from '../game';
import { Camera } from './camera';

class TrackPiece {
	length: number;
	angle: number;
	//rect: MyRect;
	shape: MyShape;
	constructor(length: number, width: number, angle: number) {
		const hw: number = width / 2;
		const hl: number = length / 2;
		this.length = length;
		this.angle = angle;
		//this.rect = new MyRect(width, length, 0x444444);
		this.shape = new MyShape(-hw, -hl, hw, hl, 0x444444);
		this.shape.angle = angle;
	}
}

export class Track extends Container {
	trackWidth: number = 12;
	game: Game;
	camera: Camera;
	constructor(game: Game) {
		super();
		this.game = game;
		this.camera = game.GetCamera();
		const piece = new TrackPiece(10, this.trackWidth, 0);
		this.addChild(piece.shape);
	}

	private UpdatePos() {
		const scaleFactor = this.camera.zoom; //this is the opposize of the cameras zoom factor which is 100/zoom
		this.position.set((0 - this.camera.position.x) * scaleFactor, (0 - this.camera.position.y) * scaleFactor);
		this.scale.set(this.camera.zoom);
	}

	Tick(dt: number) {
		this.UpdatePos();
	}
}
