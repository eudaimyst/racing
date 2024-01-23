import { Container, DEG_TO_RAD, IPointData, Point } from 'pixi.js';
import { MyShape } from '../util/gfx';
import { Game } from '../game';
import { Camera } from './camera';

function RotateEndPoints(points: Array<IPointData>, angle: number): Array<IPointData> {
	const leftPoint = points[2];
	const rightPoint = points[3];
	const midPoint = new Point((leftPoint.x + rightPoint.x) / 2, (leftPoint.y + rightPoint.y) / 2);
	//rotate the left and right point around the midpoint by the angle in degreesconst radians = angle * Math.PI / 180;
	const radians = (angle * Math.PI) / 180;

	const newLeftX = midPoint.x + (leftPoint.x - midPoint.x) * Math.cos(radians) - (leftPoint.y - midPoint.y) * Math.sin(radians);
	const newLeftY = midPoint.y + (leftPoint.x - midPoint.x) * Math.sin(radians) + (leftPoint.y - midPoint.y) * Math.cos(radians);

	const newRightX = midPoint.x + (rightPoint.x - midPoint.x) * Math.cos(radians) - (rightPoint.y - midPoint.y) * Math.sin(radians);
	const newRightY = midPoint.y + (rightPoint.x - midPoint.x) * Math.sin(radians) + (rightPoint.y - midPoint.y) * Math.cos(radians);

	points[2].x = newLeftX;
	points[2].y = newLeftY;
	points[3].x = newRightX;
	points[3].y = newRightY;
	return points;
}

class TrackPiece extends MyShape {
	length: number;
	constructor(endMidPos: Point, width: number, angle: number) {
		const halfWidth: number = width / 2;
		//we need to rotate the end position to the angle in degrees
		let points: Array<IPointData> = new Array<IPointData>();

		points.push(new Point(-halfWidth, 0)); //left point of start
		points.push(new Point(halfWidth, 0)); //right point of start

		points.push(new Point(halfWidth + endMidPos.x, -endMidPos.y)); //right point of end
		points.push(new Point(-halfWidth + endMidPos.x, -endMidPos.y)); //left point of end
		//rotate the two end points by the angle variable
		points = RotateEndPoints(points, angle);
		super(points, 0x444444);
		this.length = length;
		//this.angle = angle;
	}
}

export class Track extends Container {
	trackWidth: number = 12;
	game: Game;
	camera: Camera;
	closed: boolean = false;
	startPoint: Point = new Point(0, 0);
	openPoint: Point = new Point(0, 0);
	openAngle: number = 0;
	constructor(game: Game) {
		super();
		this.game = game;
		this.camera = game.GetCamera();
		this.CreateTrack();
	}

	/**
	 * The function creates a track piece at a given position with a specified length, turn angle, and
	 * initial angle, and returns the end position of the track piece after rotation.
	 * @param {number} length - Length of the track piece.
	 * @param {number} angle - Angle of the track piece.
	 */
	CreatePiece(length: number, angle: number) {
		const endMidPos = new Point(length * Math.sin(angle * DEG_TO_RAD), length * Math.cos(angle * DEG_TO_RAD));
		const piece = new TrackPiece(endMidPos, this.trackWidth, angle);
		piece.position.set(this.openPoint.x, this.openPoint.y);
		piece.angle = this.openAngle;
		this.openAngle += angle;
		this.addChild(piece);
		const endMidPosAfterRot = new Point(length * Math.sin(this.openAngle * DEG_TO_RAD), length * Math.cos(this.openAngle * DEG_TO_RAD));
		this.openPoint.set(this.openPoint.x + endMidPosAfterRot.x, this.openPoint.y - endMidPosAfterRot.y);
	}

	CreateTurn(angle: number, length: number, pieces: number) {
		const pieceLength = length / pieces;
		const pieceAngle = angle / pieces;

		for (let i = 0; i < pieces; i++) {
			this.CreatePiece(pieceLength, pieceAngle);
		}
	}

	CreateTrack() {
		let slalom = false;
		for (let i = 0; i < 5; i++) {
			slalom ? (this.CreateTurn(90, 20, 8), (slalom = false)) : (this.CreateTurn(-90, 20, 8), (slalom = true));
		}
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
