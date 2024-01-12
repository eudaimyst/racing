import { Application } from 'pixi.js';
import * as Game from './game.ts';

const ret = Game.Init();
const game: Application = ret.app;
const debugCallback = ret.SetDebugValue;

const screenContainer = document.createElement('div'); //div contains everything in the doc
const gameView = game.view as HTMLCanvasElement; //div contains the pixi app
const debugContainer = document.createElement('div'); //div contains the debug values and slidersforms
screenContainer.id = 'screenContainer';
debugContainer.id = 'debugContainer';

screenContainer.appendChild(gameView);
screenContainer.appendChild(debugContainer);
document.body.appendChild(screenContainer);

gameView.style.border = '1px solid red';
gameView.style.width = '50%';
gameView.style.float = 'left';

function makeSlider(label: string, min: number, max: number, start: number, callback: Function) {
	const debugItem = document.createElement('div');
	debugItem.className = 'debugItem';

	const slider = document.createElement('input');
	slider.className = 'debugSlider';
	slider.type = 'range';
	slider.min = `${min}`;
	slider.max = `${max}`;
	slider.step = '.1';
	slider.value = `${start}`;

	const inputBox = document.createElement('input');
	inputBox.className = 'debugInputBox';
	inputBox.type = 'text';
	inputBox.value = `${start}`;

	debugItem.innerText = label;
	debugItem.appendChild(slider);
	debugItem.appendChild(inputBox);
	//when slider is changed, adjust the value of the box
	callback(label, slider.value);
	slider.addEventListener('input', (e) => {
		inputBox.value = slider.value;
		callback(label, slider.value);
	});
	//when box is changed, adjust the value of the slider
	inputBox.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			slider.value = inputBox.value;
			inputBox.value = slider.value; //after validating value of slider, apply new value to box
			inputBox.blur(); //deselect the input box
			callback(label, slider.value);
		}
	});
	return debugItem;
}

debugContainer.appendChild(makeSlider('maxSteeringAngle', 30, 120, 90, debugCallback));
debugContainer.appendChild(makeSlider('steeringRate', 1, 10, 3, debugCallback));
debugContainer.appendChild(makeSlider('power', 1, 1000, 100, debugCallback));
debugContainer.appendChild(makeSlider('brakingForce', 1, 100, 10, debugCallback));
//debugContainer.appendChild(document.createElement('p'));
debugContainer.appendChild(makeSlider('resistance', 0, 10, 1, debugCallback));
debugContainer.appendChild(makeSlider('steeringRebound', 0, 15, 5, debugCallback));
/* 	maxSteeringAngle: number = 90;
	power: number = 10; //increases velocity by this rate
	brakingForce: number = 10; //slows velocity by this rate
	resistance: number = 1; //rolling resistance (TODO: Multiply by surface friction)
	steeringRebound: number = 5; */
//slider.value = inputBox.value;
//resultCell.appendChild(inputBox);
