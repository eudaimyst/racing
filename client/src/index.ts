import { Game } from './game.ts';
import '@pixi/math-extras';

const game: Game = new Game();
const carUpdateSetting: Function = game.carUpdateSetting; //sets callback function as passed from Game.Init
const camUpdateSetting: Function = game.camUpdateSetting;

//window div
const windowContainer = document.createElement('div'); //div contains everything in the doc
document.body.appendChild(windowContainer);
windowContainer.id = 'windowContainer'; //for css

//game div
const gameView = game.view as HTMLCanvasElement; //element containing the pixi app
windowContainer.appendChild(gameView);
const AdjustLayout = () => {
	window.innerWidth < window.innerHeight ? (gameView.id = 'gameViewVertical') : (gameView.id = 'gameViewHorizontal');
};
AdjustLayout();
//update id when window is resized to alter the layout of the element via css
addEventListener('resize', () => {
	AdjustLayout();
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
	const debugItem: HTMLElement = document.createElement('div');
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
	console.log(debugItem);
	return debugItem;
}

class debugExpando {
	expandoDiv = document.createElement('div');
	headingBtn: HTMLElement = document.createElement('button');
	expandoToggle: boolean = false;
	debugItems: Array<HTMLElement> = new Array<HTMLElement>();

	constructor(heading: string) {
		this.expandoDiv.style.overflow = 'hidden';
		const headingObserver = new MutationObserver((mutations) => {
			if (this.expandoToggle == false) this.expandoDiv.style.height = this.headingBtn.getBoundingClientRect().height.toString() + 'px';
		}); //checks for any changes to html elements
		headingObserver.observe(this.headingBtn, { childList: true });
		this.headingBtn.innerText = heading;
		this.headingBtn.innerText += '>';
		const ToggleExpando = () => {
			console.log('hello');
			if (this.expandoToggle) {
				if (this.headingBtn) {
					this.expandoDiv.style.height = this.headingBtn.getBoundingClientRect().height.toString() + 'px';
					this.headingBtn.innerText = this.headingBtn.innerText.slice(0, -1);
					this.headingBtn.innerText += '>';
				}
				this.expandoToggle = false;
			} else {
				this.expandoDiv.style.height = '400px';
				if (this.headingBtn) {
					this.headingBtn.innerText = this.headingBtn.innerText.slice(0, -1);
					this.headingBtn.innerText += 'V';
				}
				this.expandoToggle = true;
			}
		};
		//debugExpando.style.height = number(heading.clientHeight);
		this.expandoDiv.appendChild(this.headingBtn);
		this.headingBtn.addEventListener('click', (e) => {
			ToggleExpando();
		});
	}
	AddChild(child: HTMLElement) {
		this.debugItems.push(child);
		this.expandoDiv.appendChild(child);
	}
}

const carSettingExpando = new debugExpando('Car Settings');
const inputSettingExpando = new debugExpando('Input Settings');
const gameSettingExpando = new debugExpando('Game Settings');
debugContainer.appendChild(carSettingExpando.expandoDiv);
debugContainer.appendChild(gameSettingExpando.expandoDiv);
debugContainer.appendChild(inputSettingExpando.expandoDiv);
carSettingExpando.AddChild(makeSlider('power', 1, 100, 10, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('weight', 100, 4000, 1000, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('brakingForce', 1, 100, 10, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('resistance', 0, 2, 0.2, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('steeringForce', 0, 1, 0.1, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('maxSteeringAngle', 15, 90, 45, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('steeringRate', 1, 30, 3, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('steeringRebound', 1, 30, 15, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('loadChangeRate', 0, 10, 0.2, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('slipLimit', 0, 50, 15, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('driveBalance', 0, 1, 1, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('brakeBalance', 0, 1, 0.5, carUpdateSetting));
carSettingExpando.AddChild(makeSlider('tyreGrip', 0, 1, 1, carUpdateSetting));

gameSettingExpando.AddChild(makeSlider('cameraZoom', 1, 100, 10, camUpdateSetting));

const saveButton: HTMLElement = document.createElement('button');
saveButton.innerText = 'Save';
const loadButton: HTMLElement = document.createElement('button');
loadButton.innerText = 'Load';
debugContainer.appendChild(saveButton);
debugContainer.appendChild(loadButton);
saveButton.addEventListener('click', () => {
	//console.log(carSettingExpando.debugItems);
	let carSettingsString: string = '{';
	for (let debugElement of carSettingExpando.debugItems) {
		const t = debugElement.lastElementChild as HTMLFormElement;
		//console.log(debugElement.innerText + ': ' + t.value);
		carSettingsString += `"${debugElement.innerText}": ${t.value}`;
		if (carSettingExpando.debugItems.lastIndexOf(debugElement) == carSettingExpando.debugItems.length - 1) {
			carSettingsString += '}';
		} else carSettingsString += ', ';
	}
	console.log('saving');
	console.log(JSON.parse(carSettingsString));

	localStorage.setItem('carSettings', carSettingsString);
});

loadButton.addEventListener('click', () => {
	const carSettingString = localStorage.getItem('carSettings');
	let carSettingObj: { [key: string]: number } = {};

	if (carSettingString) {
		carSettingObj = JSON.parse(carSettingString);
		for (let key in carSettingObj) {
			console.log(`${key}: ${carSettingObj[key]}`);
			const debugElement = carSettingExpando.debugItems.find((debugElement) => debugElement.innerText == key);
			if (debugElement) {
				const t = debugElement.lastElementChild as HTMLFormElement;
				t.value = carSettingObj[key];
				game.carUpdateSetting(key, t.value);
			}
		}
	} else console.log('no settings found');
});
