import {initExampleWithControl} from "./exampleWithControl.js";
import {initExampleVideo} from "./exampleVideo.js";
import {initExampleStillImage} from "./exampleStillImage.js";
import {constructDestructTest} from "./exampleConstructDestructTest.js";
import {initExampleLoadTar} from "./exampleLoadTar.js";
import {initExampleWithCustomCanvas} from "./exampleWithCustomCanvas.js";

initExampleWithControl(document.getElementsByClassName('grid-item')[0]);
initExampleVideo(document.getElementsByClassName('grid-item')[1]);
initExampleLoadTar(document.getElementsByClassName('grid-item')[2]);
initExampleStillImage(document.getElementsByClassName('grid-item')[3]);
initExampleWithCustomCanvas(document.getElementsByClassName('grid-item')[4]);
constructDestructTest(document.getElementsByClassName('grid-item')[5]);