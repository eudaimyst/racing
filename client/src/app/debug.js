let div, text, button, game;

/**
 * The RegisterGame function is used to register a reference to the game application.
 * @param app - app is reference to the pixiJS application.
 */
export const RegisterGame = (app) => {
	game = app;
};

const addButton = (text, callback) => {
	button = document.createElement('button');
	button.onclick = () => {
		//console.log(game)
		callback();
	};
	button.innerHTML = text;

	return button;
};

export const Debug = () => {
	div = document.createElement('div');
	text = document.createElement('p');
	div.appendChild(text);
	div.appendChild(addButton('Add Bunny', game.AddBunny));
	div.appendChild(addButton('Prev Bunny', game.PrevBunny));
	div.appendChild(addButton('Next Bunny', game.NextBunny));
	div.appendChild(document.createElement('br'));
	div.appendChild(addButton('Disconnect', game.Disconnect));
	div.appendChild(addButton('Reconnect', game.Reconnect));
	div.appendChild(addButton('ClearDB', game.ClearDB));
	return div;
};

export const Log = (string) => {
	//console.log(string);
	text.innerHTML = string;
};
