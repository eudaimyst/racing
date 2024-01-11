//import * as GameCanvas from "./game/game_canvas";

import { default as App } from './app/app.js';
import { Debug } from './app/debug.js';

const siteBgColor = '#224062';
const canvasBgColor = '#3b6697';
const debugDivHeight = 200;
const game = new App(window.innerWidth, window.innerHeight - debugDivHeight, canvasBgColor);

document.body.innerHTML = '';
document.body.style.margin = '0px';
document.body.style.backgroundColor = siteBgColor;
document.body.appendChild(game.view);
document.body.appendChild(Debug());

//game.AddBunny();
