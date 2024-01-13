import { Application } from 'pixi.js';
import { Game } from './game.ts';

const game: Game = new Game();
const carUpdateSetting = game.carUpdateSetting; //sets callback function as passed from Game.Init

//window div
const windowContainer = document.createElement('div'); //div contains everything in the doc
document.body.appendChild(windowContainer);
windowContainer.id = 'windowContainer'; //for css

//game div
const gameView = game.view as HTMLCanvasElement; //element containing the pixi app
windowContainer.appendChild(gameView);
window.innerWidth < window.innerHeight ? (gameView.id = 'gameViewVertical') : (gameView.id = 'gameViewHorizontal');
//update id when window is resized to alter the layout of the element via css
addEventListener('resize', () => {
	window.innerWidth < window.innerHeight ? (gameView.id = 'gameViewVertical') : (gameView.id = 'gameViewHorizontal');
});

//debug div
const debugContainer = document.createElement('div'); //div contains the debug values and slidersforms
debugContainer.id = 'debugContainer'; //for css
windowContainer.appendChild(debugContainer);

/**
 * Creates a slider input element which also has a input box to adjust the value.
 * Passes the new value to the callback function when set.
 * @param {string} label - used for display, also passed to callback fn, must be name of the key in the vehicle Map
 * @param {number} min - minimum value of the slider.
 * @param {number} max - maximum value of the slider.
 * @param {number} initial - initial value of the slider and input box.
 * @param {Function} cb - called whenever the value of the slider or input box changes.
 * Takes two arguments: the label of the slider and the new value of the slider.
 * @returns a div element with the class name "debugItem".
 */
function makeSlider(label: string, min: number, max: number, initial: number, cb: Function) {
	const debugItem = document.createElement('div');
	debugItem.className = 'debugItem';

	const slider = document.createElement('input');
	slider.className = 'debugSlider';
	slider.type = 'range';
	slider.min = `${min}`;
	slider.max = `${max}`;
	slider.step = '.1';
	slider.value = `${initial}`;

	const inputBox = document.createElement('input');
	inputBox.className = 'debugInputBox';
	inputBox.type = 'text';
	inputBox.value = `${initial}`;

	debugItem.innerText = label;
	debugItem.appendChild(slider);
	debugItem.appendChild(inputBox);
	//when slider is changed, adjust the value of the box
	cb(label, slider.value);
	slider.addEventListener('input', (e) => {
		inputBox.value = slider.value;
		cb(label, slider.value);
	});
	//when box is changed, adjust the value of the slider
	inputBox.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			slider.value = inputBox.value;
			inputBox.value = slider.value; //after validating value of slider, apply new value to box
			inputBox.blur(); //deselect the input box
			cb(label, slider.value);
		}
	});
	return debugItem;
}

debugContainer.appendChild(makeSlider('maxSteeringAngle', 30, 120, 90, carUpdateSetting));
debugContainer.appendChild(makeSlider('steeringRate', 1, 10, 3, carUpdateSetting));
debugContainer.appendChild(makeSlider('power', 1, 1000, 100, carUpdateSetting));
debugContainer.appendChild(makeSlider('brakingForce', 1, 100, 10, carUpdateSetting));
debugContainer.appendChild(makeSlider('resistance', 0, 10, 1, carUpdateSetting));
debugContainer.appendChild(makeSlider('steeringRebound', 0, 15, 5, carUpdateSetting));