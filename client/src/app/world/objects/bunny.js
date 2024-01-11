import { Texture } from 'pixi.js'; //allows accessing directly, better performance

export const SpawnBunny = (world, x, y, id) => {
	let bunny = world.CreateObject(id, x, y, Texture.from('./images/bunny.png'));
	if (id) bunny.SetID(id);

	let r = () => Math.random() - 0.5;
	//adds random spinning and velocity for testing
	//bunny.spinrate = r();
	//(bunny.xVel = r() * 5), (bunny.yVel = r() * 5);

	bunny.Tick = (delta) => {
		//bunny.Move(bunny.xVel * delta, bunny.yVel * delta)
		bunny.UpdatePos();

		//rotate bunny
		//bunny.rotation = bunny.rotation + delta * bunny.spinrate;
	};
	return bunny;
};
