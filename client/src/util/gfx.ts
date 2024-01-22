import { ColorSource, Graphics, IPointData, IShape, Polygon } from 'pixi.js';

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
	constructor(p1x: number, p1y: number, p2x: number, p2y: number, color: ColorSource) {
		super(color);
		const pointData: IPointData = { x: p1x, y: p1y };
		const pointData2: IPointData = { x: p2x, y: p1y };
		const pointData3: IPointData = { x: p2x, y: p2y };
		const pointData4: IPointData = { x: p1x, y: p2y };
		const shape: IShape = new Polygon(pointData, pointData2, pointData3, pointData4);
		this.beginFill(color);
		this.objDraw = () => {
			this.drawShape(shape);
		};
		this.objDraw();
		this.endFill();
	}
}
