import { Point } from 'pixi.js';
import '@pixi/math-extras';

export const Test = () => {
	const extrasTest: Point = new Point();
	extrasTest.set(1, 2);
	//extrasTest.multiplyScalar(2);
	console.log(extrasTest);
};
