'use strict';

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

const DIMS = {
    aspect: 1,
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
};

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
    DIMS.aspect = desHeight / desWidth;
    DIMS.scaleX = desWidth / 2 * DIMS.aspect;
    DIMS.scaleY = -desHeight / 2;
    DIMS.translateX = desWidth / 2;
    DIMS.translateY = desHeight / 2;
    //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
    ctx.setTransform(DIMS.scaleX, 0, 0, DIMS.scaleY, DIMS.translateX, DIMS.translateY);
}

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
 * @param {string|number} color Fill color as a string or an RGBA integer (u32)
 * @returns {void}
 */
function fill(color) {
    ctx.fillStyle = canvasColorFromNumberOrString(color);
}

/**
 * Set the stroke color
 * @param {string|number} color Stroke color as a string or an RGBA integer (u32)
 * @returns {void}
 */
function stroke(color) {
    ctx.strokeStyle = canvasColorFromNumberOrString(color);
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
 * Given an integer (u32) representing an RGBA color,
 * returns a canvas-compatible color string.
 * @param {number} rgba 
 * @returns {string}
 */
function canvasColorFromNumber(rgba) {
    return `#${(rgba >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * @param {string|number} color Color as a string or an RGBA integer (u32)
 * @returns {string} Color as a canvas string
 */
function canvasColorFromNumberOrString(color) {
    if (typeof(color) === 'string') {
        return color;
    } else if (typeof(color) === 'number') {
        return canvasColorFromNumber(color);
    }
}

/**
 * Clear the full canvas with the given color.
 * @param {string} color 
 * @returns {void}
 */
function clear(color) {
    const prevColor = ctx.fillStyle;
    ctx.fillStyle = canvasColorFromNumberOrString(color);
    rect(-DIMS.scaleX * 0.5, -DIMS.scaleY * 0.5, DIMS.scaleX, DIMS.scaleY);
    ctx.fillStyle = prevColor;
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
 * @returns {void}
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
 * @returns {void}
 */
function text(text, x, y) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    const scale = 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillText(text, width * (x * 0.5 * DIMS.aspect + 0.5), height * (0.5 - y * 0.5));
    ctx.setTransform(DIMS.scaleX, 0, 0, DIMS.scaleY, DIMS.translateX, DIMS.translateY);
}

/**
 * Returns the width of the given text 
 * in the normalized coordinate system, using the current
 * font size.
 * @param {string} text
 */
function measureTextDims(text) {
    const scale = 1;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const measurements = ctx.measureText(text);
    const textWidth = measurements.width / DIMS.scaleX;
    const textHeight = (measurements.actualBoundingBoxAscent - measurements.actualBoundingBoxDescent) / -DIMS.scaleY;

    ctx.setTransform(DIMS.scaleX, 0, 0, DIMS.scaleY, DIMS.translateX, DIMS.translateY);
    return [textWidth, textHeight];
}

class UserInterface {
    /** @type {[x: number, y: number]} Position of the mouse in normalized coordinates. */
    mousePosition = [0, 0];
    /** @type {boolean} Was the mouse clicked this frame? */
    mouseClicked = false;

    COLOR_IDLE = 'black'
    COLOR_HOVERED = 'green'
    COLOR_ACTIVE = 'yellow'
    COLOR_TEXT_IDLE = 'white'
    COLOR_TEXT_HOVERED = 'black'

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        const canvas = ctx.canvas;

        /**
         * @param {MouseEvent} mouseEvent 
         */
        const _onMouseMove = (mouseEvent) => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const aspect = height / width;
            const scaleX = width / 2 * aspect;
            const scaleY = -height / 2;
            const translateX = width / 2;
            const translateY = height / 2;
            this.mousePosition[0] = (mouseEvent.clientX - translateX) / scaleX;
            this.mousePosition[1] = (mouseEvent.clientY - translateY) / scaleY;
        }

        /**
         * @param {MouseEvent} mouseEvent 
         */
        const _onMouseClick = (mouseEvent) => {
            this.mouseClicked = true;
        }

        window.addEventListener('mousemove', _onMouseMove);
        window.addEventListener('click', _onMouseClick);

        this._removeListeners = () => {
            window.removeEventListener('mousemove', _onMouseMove);
            window.removeEventListener('click', _onMouseClick);
        }
    }

    /**
     * Is the mouse hovering over the given rectangle?
     * @param {number} x Left normalized coordinate of the rect
     * @param {number} y Bottom normalized coordinate of the rect
     * @param {number} width Width of the rect in normalized coordinates
     * @param {number} height Height of the rect in normalized coordinates
     * @returns True if the mouse is over the rectangle.
     */
    isHoveringRect(x, y, width, height) {
        const pos = this.mousePosition;
        return pos[0] > x && pos[0] < x + width
            && pos[1] > y && pos[1] < y + height;
    }

    /** 
     * Draws an interactive button.
     * @param {string} label Text to display on the button
     * @param {number} x Normalized left coordinate of the button
     * @param {number} y Normalized bottom coordinate of the button
     * @returns {boolean} True if the button was clicked this frame
     */
    button(label, x, y) {
        textSize(20);
        const labelDims = measureTextDims(label);
        const padding = 0.02;
        const width = labelDims[0] + padding * 2;
        const height = labelDims[1] + padding * 2;

        const isHovered = this.isHoveringRect(x, y, width, height);
        const wentDown = isHovered && this.mouseClicked;

        fill(isHovered? this.COLOR_HOVERED : this.COLOR_IDLE);
        rect(x, y, width, height);
        fill(isHovered? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE);
        text(label, x + padding, y + padding);

        return wentDown;
    }

    /** 
     * Draws an interactive button that has an active/inactive state.
     * @param {string} label Text to display on the button
     * @param {boolean} isActive Should the button appear "active" even if not hovered?
     * @param {number} x Normalized left coordinate of the button
     * @param {number} y Normalized bottom coordinate of the button
     * @returns {boolean} True if the button was clicked this frame
     */
    toggleButton(label, isActive, x, y) {
        textSize(20);
        const labelDims = measureTextDims(label);
        const padding = 0.02;
        const width = labelDims[0] + padding * 2;
        const height = labelDims[1] + padding * 2;

        const isHovered = this.isHoveringRect(x, y, width, height);
        const wentDown = isHovered && this.mouseClicked;

        if (isHovered) {
            fill(this.COLOR_HOVERED);
        } else if (isActive) {
            fill(this.COLOR_ACTIVE);
        } else {
            fill(this.COLOR_IDLE);
        }
        rect(x, y, width, height);

        fill(isHovered || isActive? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE);
        text(label, x + padding, y + padding);

        return wentDown;
    }

    /** 
     * Must be called exactly once at the end of the frame.
     * @returns {void}
     */
    onFrameEnd() {
        this.mouseClicked = false;
    }

    /** 
     * Remove all event listeners set up in the constructor.
     * @returns {void}
     */
    cleanUp() {
        this._removeListeners();
    }
}

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
};
dataWs.onclose = (evt) => {
    console.log('CLOSED');
};
dataWs.onmessage = (evt) => {
    console.log('MSG', evt);
};

/**
 * @typedef State
 * Mutable state that may be mutated by each animation tick.
 * `data` is of particular importance -- it will be sent to the server each frame.
 * The server will forward it to the microcontroller.
 */
let state = {
    /** 
     * @type {Uint8Array} bytes representing LED colors. Every 3 bytes correspond to the Red, Green, and Blue channels of an LED.
     * The length of this `Uint8Array` should exactly match 3 times the total number of LEDs.
    */
    data: new Uint8Array(0),
    lineX: 0,
    animState: 0
};

/**
 * @typedef Mappings
 * Mappings that express the relationship between data points in different coordinate systems.
 * The length of each array should correspond to the total number of LEDs.
 */
const mappings = {
    /** @type {[x: number, y: number, z: number][]} array of data points in physical coordinates */
    physical: [],
    /** @type {[x: number, y: number, z: number][]} corresponding array of data points in normalized coordinates */
    normalized: []
}

/**
 * Load the given mapping file containing physical coordinates.
 * Use it to initialize the nomalized mappings and the data `Uint8Array`.
 */
fetch(`http://${window.location.host}/mappings/mapping.json`).then(async (value) => {
    const data = await value.json();
    mappings.physical = data;
    mappings.normalized = mapPointsToNormalizedCoords(data);

    state.data = new Uint8Array(data.length * 3); // 3 bytes per LED, for Red, Green, Blue channels of each LED
});
/** @type HTMLCanvasElement */
const canvas = document.getElementById('visualization');
/** @type CanvasRenderingContext2D */
const ctx = canvas.getContext('2d');
autoResize(ctx);

/** Circle constant -- radians in a full circle */
const TAU = Math.PI * 2;

const UI = new UserInterface(ctx);

/**
 * Animation tick function called repeatedly.
 * @param {number} elapsedMs Number of milliseconds elapsed since last tick
 * @param {Mappings} mappings 
 * @param {State} state 
 */
function tick(elapsedMs, mappings, state) {
    const pixelsToNorm = 1 / ctx.canvas.clientHeight;
    const bottom = -1;
    const top = 1;
    const left = -1;
    const right = 1;

    strokeWeight(2 * pixelsToNorm);

    // Background
    clear('#ff00ffff');

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
            strokeWeight(4 * pixelsToNorm);
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
        fill(color);
        circle(pt[0], pt[1], 0.01);
    }

    if (UI.toggleButton('Anim 1', state.animState == 0, -1, 0.5)) {
        state.animState = 0;
    }
    if (UI.toggleButton('Anim 2', state.animState == 1, -1, 0.4)) {
        state.animState = 1;
    }

    if (dataWs.readyState === WebSocket.OPEN) {
        dataWs.send(state.data);
    }
}

/**
 * Main animation loop
 * @param {number} elapsedMs Number of milliseconds that elapsed since the last call.
 */
function loop(elapsedMs) {
    autoResize(ctx);
    tick(elapsedMs, mappings, state);
    UI.onFrameEnd();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);