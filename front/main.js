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
    lineX: 0
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
    // [[min,max],[min,max],[min,max]]
    const res = [[Infinity, -Infinity], [Infinity, -Infinity], [Infinity, -Infinity]];
    for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        res[0][0] = Math.min(res[0][0], pt[0]);
        res[0][1] = Math.max(res[0][1], pt[0]);

        res[1][0] = Math.min(res[1][0], pt[1]);
        res[1][1] = Math.max(res[1][1], pt[1]);

        res[2][0] = Math.min(res[2][0], pt[2]);
        res[2][1] = Math.max(res[2][1], pt[2]);
    }
    return res;
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
        maxBoundValue = Math.max(maxBoundValue, Math.abs(bounds[i][0]));
        maxBoundValue = Math.max(maxBoundValue, Math.abs(bounds[i][1]));
    }
    const scaleFactor = 1 / maxBoundValue;

    const res = [];
    for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        const scaledPt = [pt[0] * scaleFactor, pt[1] * scaleFactor, pt[1] * scaleFactor];
        res.push(scaledPt);
    }
    return res;
}

fetch(`http://${window.location.host}/mappings/mapping.json`).then(async (value) => {
    const data = await value.json();
    mappings.physical = data;
    mappings.normalized = mapPointsToNormalizedCoords(data);

    state.data = new Uint8Array(data.length * 3); // 3 bytes per LED, for colors
});

function autoResize(ctx) {
    const canvas = ctx.canvas;
    const desWidth = canvas.clientWidth * devicePixelRatio;
    const desHeight = canvas.clientHeight * devicePixelRatio;
    if (desWidth !== canvas.width || desHeight !== canvas.height) {
        canvas.width = desWidth;
        canvas.height = desHeight;
    }
    ctx.setTransform(0.5, 0, 0, -0.5, canvas.width * 0.5, canvas.height * 0.5);
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

function loop(elapsedMs) {
    autoResize(ctx);
    const bottom = -canvas.height;
    const top = canvas.height;
    const left = -canvas.width;
    const right = canvas.width;
    const halfWidth = canvas.width;
    const halfHeight = canvas.height;
    const width = canvas.width * 2;
    const height = canvas.height * 2;

    // Background
    fill('#ff00ffff');
    rect(left, bottom, width, height);

    // Crosshairs
    stroke('#000000bb');
    line(left, 0, right, 0);
    line(0, bottom, 0, top);

    const mapping = mappings.normalized;

    state.lineX += 0.001;
    if (state.lineX > 1) {
        state.lineX = 0;
    }
    let lineXNorm = state.lineX;
    let lineXCanvas = state.lineX * halfWidth;

    for (let i = 0; i < mapping.length; i++) {
        const pt = mapping[i];
        const canvasPt = [pt[0] * halfWidth, pt[1] * halfHeight];

        // let x = (elapsedMs % 5000) / 5000 * right;
        line(lineXCanvas, bottom, lineXCanvas, top);

        let di = dist(lineXNorm, 0, pt[0], pt[1]);
        // console.log(di);
        // line(x, 0, canvasPt[0], canvasPt[1]);
        // if (di < 0.5) {
        //     state.data[i * 3 + 0] = 255;
        // } else {
        //     state.data[i * 3 + 0] = 0;
        // }

        if (Math.abs(pt[0] - lineXNorm) < 0.3) {
            state.data[i * 3 + 0] = 255;
        } else {
            state.data[i * 3 + 0] = 0;
        }


        fill('#00000000');
        stroke(1);

        let dia = (Math.sin(elapsedMs * 0.001) + 1) * 0.5;
        ellipse(0, 0, halfWidth * dia, halfWidth * dia);

        // if (length(pt[0], pt[1]) < dia) {
        //     state.data[i * 3 + 0] = 255;
        // } else {
        //     state.data[i * 3 + 0] = 0;
        // }



        state.data[i * 3 + 1] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
        state.data[i * 3 + 2] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
    }

    for (let i = 0; i < mapping.length; i++) {
        const pt = mapping[i];

        // Calculate the color of the current pixel:
        const color = 0xFF | state.data[i * 3 + 2] << 8 | state.data[i * 3 + 1] << 16 | state.data[i * 3 + 0] << 24;
        fill(`#${(color >>> 0).toString(16).padStart(8, '0')}`);
        circle(pt[0] * halfWidth, pt[1] * halfHeight, 10);
    }


    if (isReadyToSend) {
        dataWs.send(state.data);
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);