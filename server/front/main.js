console.log('Hello!');

let isReadyToSend = false;

const statusWs = new WebSocket(`ws://${window.location.host}/status`);
statusWs.onopen = (evt) => {
    console.log('OPEN');
};
statusWs.onmessage = (evt) => {
    console.log('MSG', evt);
};

const dataWs = new WebSocket(`ws://${window.location.host}/data`);
dataWs.onopen = (evt) => {
    console.log('OPEN');
    isReadyToSend = true;
};
dataWs.onclose = (evt) => {
    console.log('CLOSED');
    isReadyToSend = false;
};
dataWs.onmessage = (evt) => {
    console.log('MSG', evt);
};

let state = {
    data: new Uint8Array(0),
    lineX: 0,
    animState: 0
};

let mappings = {
    physical: [],
    normalized: []
}

/**
 * Computes the bounding box of a set of points, returning a 3d array where each element
 * is a 2d array containing the min and max extent of that dimension
 * @param {[number,number,number][]} dataPoints
 * @returns {[[minX:number,maxX:number], [minY:number,maxY:number], [minZ:number,maxZ:number]]}
 */
function computeBoundingBox(dataPoints) {
    // Initialize a bounding box that contains nothing:
    const minMaxX = [Infinity, -Infinity];
    const minMaxY = [Infinity, -Infinity];
    const minMaxZ = [Infinity, -Infinity];

    // Loop through all the points and compute their
    // minimum and maximum extents on every axis:
    for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        // Only allow the point to modify the extents if it is
        // not alreay encompassed in the bounds
        minMaxX[0] = Math.min(minMaxX[0], pt[0]);
        minMaxX[1] = Math.max(minMaxX[1], pt[0]);

        minMaxY[0] = Math.min(minMaxY[0], pt[1]);
        minMaxY[1] = Math.max(minMaxY[1], pt[1]);

        minMaxZ[0] = Math.min(minMaxZ[0], pt[2]);
        minMaxZ[1] = Math.max(minMaxZ[1], pt[2]);
    }
    return [minMaxX, minMaxY, minMaxZ];
}

/**
 * Linearly interpolates between `a` and `b` via `t`.
 * Returns `a` if `t` is 0.
 * Returns `b` if `t` is 1.
 * Returns in-between values for `t` between 0 and 1.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number} interpolated value
 */
function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

/**
 * Computes the inverse lerp.
 * If `v` is `a`, returns 0.
 * If `v` is `b`, returns 1.
 * Otherwise, returns values in-between.
 * Fails if `a` and `b` are the same.
 * @param {number} a
 * @param {number} b
 * @param {number} v
 * @returns {number} computed t value
 */
function ilerp(a, b, v) {
    return (v - a) / (b - a);
}

/**
 * Linearly maps an `inValue` into a new coordinate space.
 * If `inValue` is `inStart`, returns `outStart`.
 * If `inValue` is `inEnd`, returns `outEnd`.
 * @param {number} inStart
 * @param {number} inEnd
 * @param {number} outStart
 * @param {number} outEnd
 * @param {number} inValue
 * @returns {number} outValue
 */
function linMap(inStart, inEnd, outStart, outEnd, inValue) {
    return lerp(outStart, outEnd, ilerp(inStart, inEnd, inValue));
}

/**
 * Given some data points, converts them to points in a normalized coordinate space.
 * such that the max values are at 1 or -1.
 * @param {[x:number, y:number, z:number][]} dataPoints
 */
function mapPointsToNormalizedCoords(dataPoints) {
    const bounds = computeBoundingBox(dataPoints);

    let maxBoundValue = -Infinity;
    for (let i = 0; i < bounds.length; i++) {
        const axisMinMax = bounds[i];
        maxBoundValue = Math.max(maxBoundValue, Math.abs(axisMinMax[0]));
        maxBoundValue = Math.max(maxBoundValue, Math.abs(axisMinMax[1]));
    }
    const scaleFactor = 1 / maxBoundValue;

    const normalizedPoints = [];
    for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        const scaledPt = [pt[0] * scaleFactor, pt[1] * scaleFactor, pt[1] * scaleFactor];
        normalizedPoints.push(scaledPt);
    }
    return normalizedPoints;
}

fetch(`http://${window.location.host}/mappings/mapping.json`).then(async (value) => {
    const data = await value.json();
    mappings.physical = data;
    mappings.normalized = mapPointsToNormalizedCoords(data);

    state.data = new Uint8Array(data.length * 3); // 3 bytes per LED, for colors
});

/**
 * Auto-resize the canvas to have the same number of pixels as the actual screen.
 * Set the canvas transformation matrix to initialize the canvas
 * coordinate space.
 * @param {CanvasRenderingContext2D} ctx
 */
function autoResize(ctx) {
    const canvas = ctx.canvas;
    const desWidth = canvas.clientWidth * devicePixelRatio;
    const desHeight = canvas.clientHeight * devicePixelRatio;
    if (desWidth !== canvas.width || desHeight !== canvas.height) {
        canvas.width = desWidth;
        canvas.height = desHeight;
    }
    //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
    //
    const aspect = desHeight / desWidth;

    const scaleX = desWidth / 2 * aspect;
    const scaleY = -desHeight / 2;
    const translateX = desWidth / 2;
    const translateY = desHeight / 2;
    ctx.setTransform(scaleX, 0, 0, scaleY, translateX, translateY);
}

/** @type HTMLCanvasElement */
const canvas = document.getElementById('visualization');
/** @type CanvasRenderingContext2D */
const ctx = canvas.getContext('2d');
autoResize(ctx);


const TAU = Math.PI * 2;

/**
 * Draw a line with the current stroke color
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {void}
 */
function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

/**
 * Draw a circle with the current fill color
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @returns {void}
 */
function circle(x, y, radius) {
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius, 0, 0, TAU);
    ctx.fill();
}

/**
 * Draw an ellipse with the current fill color
 * @param {number} x
 * @param {number} y
 * @param {number} r1
 * @param {number} r2
 * @returns {void}
 */
function ellipse(x, y, r1, r2) {
    ctx.beginPath();
    ctx.ellipse(x, y, r1, r2, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
}

/**
 * Set the fill color
 * @param {string} color
 * @returns {void}
 */
function fill(color) {
    ctx.fillStyle = color;
}

/**
 * Set the stroke color
 * @param {string} color
 * @returns {void}
 */
function stroke(color) {
    ctx.strokeStyle = color;
}

/**
 * Set the stroke thickness
 * @param {string} weight
 * @returns {void}
 */
function strokeWeight(weight) {
    ctx.lineWidth = weight;
}

/**
 * Draw a rectangle with the current fill color
 * @param {string} color
 * @returns {void}
 */
function rect(x, y, width, height) {
    ctx.fillRect(x, y, width, height);
}

/**
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @returns The distance between two points
 */
function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

/**
 * @param x
 * @param y
 * @returns The length of a vector
 */
function length(x, y) {
    return Math.sqrt(x * x + y * y);
}

/**
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @returns The squared distance between two points
 */
function sqrDist(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

/**
 * Set the text size in screen pixels.
 * @param {number} size
 */
function textSize(size) {
    ctx.font = `${size}px sans-serif`;
}

/**
 * Draw the given `text` string at the specified
 * x,y coordinate in normalized space.
 * @param {string} text
 * @param {number} x
 * @param {number} y
 */
function text(text, x, y) {
    const canvas = ctx.canvas;
    const desWidth = canvas.width;
    const desHeight = canvas.height;

    const aspect = desHeight / desWidth;
    const scale = 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillText(text, desWidth * (x * 0.5 * aspect + 0.5), desHeight * (0.5 - y * 0.5));

    const scaleX = desWidth / 2 * aspect;
    const scaleY = -desHeight / 2;
    const translateX = desWidth / 2;
    const translateY = desHeight / 2;
    ctx.setTransform(scaleX, 0, 0, scaleY, translateX, translateY);
}

/**
 * Returns the width of the given text 
 * in the normalized coordinate system, using the current
 * font size.
 * @param {string} text
 */
function measureTextDims(text) {
    const canvas = ctx.canvas;
    const desWidth = canvas.width;
    const desHeight = canvas.height;

    const scale = 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const aspect = desHeight / desWidth;
    const scaleX = desWidth / 2 * aspect;
    const scaleY = -desHeight / 2;
    const translateX = desWidth / 2;
    const translateY = desHeight / 2;

    const measurements = ctx.measureText(text);
    const textWidth = measurements.width / scaleX;
    const textHeight = (measurements.actualBoundingBoxAscent - measurements.actualBoundingBoxDescent) / -scaleY;

    ctx.setTransform(scaleX, 0, 0, scaleY, translateX, translateY);
    return [textWidth, textHeight];
}

class UserInterface {
    mousePosition = [0, 0];
    mouseClicked = false;

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        const canvas = ctx.canvas;
        window.addEventListener('mousemove', this._onMouseMove.bind(this));
        window.addEventListener('click', this._onMouseClick.bind(this));
    }

    _onMouseMove = (mouseEvent) => {
        const desWidth = canvas.width;
        const desHeight = canvas.height;
        const aspect = desHeight / desWidth;
        const scaleX = desWidth / 2 * aspect;
        const scaleY = -desHeight / 2;
        const translateX = desWidth / 2;
        const translateY = desHeight / 2;
        this.mousePosition[0] = (mouseEvent.clientX - translateX) / scaleX;
        this.mousePosition[1] = (mouseEvent.clientY - translateY) / scaleY;
    }

    _onMouseClick = (mouseEvent) => {
        this.mouseClicked = true;
    }

    isHoveringRect(x, y, width, height) {
        const pos = this.mousePosition;
        return pos[0] > x && pos[0] < x + width
            && pos[1] > y && pos[1] < y + height;
    }

    button(label, x, y) {
        textSize(20);
        const labelDims = measureTextDims(label);
        const padding = 0.02;
        const width = labelDims[0] + padding * 2;
        const height = labelDims[1] + padding * 2;

        let wentDown = false;
        if (this.isHoveringRect(x, y, width, height)) {
            fill('green');
            wentDown = this.mouseClicked;
        } else {
            fill('black');
        }
        rect(x, y, width, height);
        fill('white');
        text(label, x + padding, y + padding);

        return wentDown;
    }

    toggleButton(label, isActive, x, y) {
        textSize(20);
        const labelDims = measureTextDims(label);
        const padding = 0.02;
        const width = labelDims[0] + padding * 2;
        const height = labelDims[1] + padding * 2;

        let wentDown = false;
        let showActive = isActive;
        if (this.isHoveringRect(x, y, width, height)) {
            showActive = true;
            wentDown = this.mouseClicked;
        }
        if (showActive) {
            fill('green');
        } else {
            fill('black');
        }
        rect(x, y, width, height);
        fill('white');
        text(label, x + padding, y + padding);

        return wentDown;
    }

    onFrameEnd() {
        this.mouseClicked = false;
    }

    cleanUp() {
        window.removeEventListener('mousemove', this._onMouseMove);
    }
}

const UI = new UserInterface(ctx);

function loop(elapsedMs) {
    autoResize(ctx);
    const pixelsToNorm = 1 / ctx.canvas.width;
    const bottom = -1;
    const top = 1;
    const left = -1;
    const right = 1;
    const width = 2;
    const height = 2;


    // if (UI.button('Anim 1', x, y)) {

    // }

    strokeWeight(2 * pixelsToNorm);


    // Background
    fill('#ff00ffff');
    rect(-2, bottom, width * 2, height);
    rect(left, bottom, width, height);

    // Origin Crosshairs
    stroke('#000000bb');
    line(left, 0, right, 0);
    line(0, bottom, 0, top);

    const normMapping = mappings.normalized;

    state.lineX += 0.01;
    if (state.lineX > 1) {
        state.lineX = 0;
    }
    let lineXNorm = state.lineX;

    for (let i = 0; i < normMapping.length; i++) {
        const pt = normMapping[i];

        // let x = (elapsedMs % 5000) / 5000 * right;

        // let di = dist(lineXNorm, 0, pt[0], pt[1]);
        // console.log(di);
        // line(x, 0, canvasPt[0], canvasPt[1]);
        // if (di < 0.5) {
        //     state.data[i * 3 + 0] = 255;
        // } else {
        //     state.data[i * 3 + 0] = 0;
        // }

        if (state.animState == 0) {
            line(lineXNorm, bottom, lineXNorm, top);
            let distToVerticalLine = Math.abs(pt[0] - lineXNorm);
            if (distToVerticalLine < 0.3) {
                //red
                state.data[i * 3 + 0] = 255;
            } else {
                state.data[i * 3 + 0] = 0;
            }
        }

        if (state.animState == 1) {
            fill('#00000000');
            let dia = (Math.sin(elapsedMs * 0.001) + 1) * 0.5;
            ellipse(0, 0, dia, dia);
            if (length(pt[0], pt[1]) < dia) {
                state.data[i * 3 + 0] = 255;
            } else {
                state.data[i * 3 + 0] = 0;
            }
        }


        //green and blue
        state.data[i * 3 + 1] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
        state.data[i * 3 + 2] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
    }

    for (let i = 0; i < normMapping.length; i++) {
        const pt = normMapping[i];

        // Calculate the color of the current pixel:
        const color = 0xFF | state.data[i * 3 + 2] << 8 | state.data[i * 3 + 1] << 16 | state.data[i * 3 + 0] << 24;
        fill(`#${(color >>> 0).toString(16).padStart(8, '0')}`);
        circle(pt[0], pt[1], 0.01);
    }

    if (UI.toggleButton('Anim 1', state.animState == 0, -0.5, 0.5)) {
        state.animState = 0;
    }
    if (UI.toggleButton('Anim 2', state.animState == 1, -0.5, 0.4)) {
        state.animState = 1;
    }

    if (isReadyToSend) {
        dataWs.send(state.data);
    }

    UI.onFrameEnd();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);