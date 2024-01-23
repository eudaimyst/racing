import { ColorSource, Graphics, IPointData, IShape, Point, Polygon } from 'pixi.js';

class GFXObj extends Graphics {
	objColor: ColorSource;
	objDraw = () => {};
	constructor(color: ColorSource) {
		super();
		this.objColor = color;
	}

	SetColor(color: ColorSource) {
		this.clear();
		this.beginFill(color);
		this.objDraw();
		this.endFill();
	}
}

export class MyLine extends GFXObj {
	objLength: number;
	objWidth: number;

	constructor(length: number, width: number, color: ColorSource) {
		super(color);
		this.objLength = length;
		this.objWidth = width;
		this.objDraw = () => {
			this.lineStyle(width, color);
			this.moveTo(0, 0);
			this.lineTo(0, -length);
		};
		this.objDraw;
	}
}

export class MyRect extends GFXObj {
	objWidth: number;
	objHeight: number;
	constructor(width: number, height: number, color: ColorSource) {
		super(color);
		this.objWidth = width;
		this.objHeight = height;
		this.beginFill(color);
		this.objDraw = () => {
			this.drawRect(-this.objWidth / 2, -this.objHeight / 2, this.objWidth, this.objHeight);
		};
		this.objDraw();
		this.endFill();
	}
}

export class MyCircle extends GFXObj {
	objRadius: number;
	constructor(radius: number, color: ColorSource) {
		super(color);
		this.objRadius = radius;
		this.beginFill(color);
		this.objDraw = () => {
			this.drawCircle(0, 0, this.objRadius);
		};
		this.objDraw();
		this.endFill();
	}
}

export class MyShape extends GFXObj {
	constructor(points: Array<IPointData>, color: ColorSource) {
		super(color);
		const shape: IShape = new Polygon(points[0], points[1], points[2], points[3]);
		this.beginFill(color);
		this.objDraw = () => {
			this.drawShape(shape);
		};
		this.objDraw();
		this.endFill();
	}
}
