import { Container, Sprite, Transform, Matrix, ObservablePoint } from 'pixi.js';

export default class GameObject extends Container {
	world;
	sprite;
	worldPosition;
	id;

	/**
	 * Extends Container including worldPosition Transform,
	 * sprite and Tick method to update from World currentCamera pos
	 * @param world - The "world" parameter is a reference to the game world
	 * @param texture - used to create sprite
	 * @param x - x-coord in world space
	 * @param y - y-coord in world space
	 * @returns game object class instance
	 */
	constructor(world, texture, x, y) {
		super();

		this.world = world;
		this.worldPosition = new ObservablePoint(this.UpdatePos, this, x, y);

		this.sprite = new Sprite(texture);
		this.sprite.anchor.set(0.5);
		this.addChild(this.sprite);
		this.UpdatePos();
		//this.SetWorldPos(x, y);

		return this;
	}

	SetWorldPos = (x, y) => {
		this.worldPosition.set(x, y);
		this.UpdatePos();
	};

	SetID = (id) => {
		this.id = id;
	};

	GetID = () => {
		return this.id;
	};

	UpdatePos = () => {
		this.position.set(
			this.worldPosition.x - this.world.GetCamPosOffset().x,
			this.worldPosition.y - this.world.GetCamPosOffset().y
		);
	};

	ReplicateMoveBy(x, y) {
		console.log('replicating to: ', x, y);
		this.SetWorldPos(x, y);
		this.UpdatePos();
	}

	MoveBy = (x, y, socket) => {
		if (socket) {
			console.log('sending server update for ', this.id, x, y);
			socket.emit('game object update', this.id, x, y);
		}
	};

	MoveTo = (x, y) => {
		this.SetWorldPos(x, y);
	};

	Tick = (delta) => {
		console.log('updating', this.id);
		this.UpdatePos();
	};
}
