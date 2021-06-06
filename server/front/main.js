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

// /**
//  * Linearly interpolates between `a` and `b` via `t`.
//  * Returns `a` if `t` is 0.
//  * Returns `b` if `t` is 1.
//  * Returns in-between values for `t` between 0 and 1.
//  * @param {number} a
//  * @param {number} b
//  * @param {number} t
//  * @returns {number} interpolated value
//  */
// function lerp(a, b, t) {
//     return (1 - t) * a + t * b;
// }

// /**
//  * Computes the inverse lerp.
//  * If `v` is `a`, returns 0.
//  * If `v` is `b`, returns 1.
//  * Otherwise, returns values in-between.
//  * Fails if `a` and `b` are the same.
//  * @param {number} a
//  * @param {number} b
//  * @param {number} v
//  * @returns {number} computed t value
//  */
// function ilerp(a, b, v) {
//     return (v - a) / (b - a);
// }

// /**
//  * Linearly maps an `inValue` into a new coordinate space.
//  * If `inValue` is `inStart`, returns `outStart`.
//  * If `inValue` is `inEnd`, returns `outEnd`.
//  * @param {number} inStart
//  * @param {number} inEnd
//  * @param {number} outStart
//  * @param {number} outEnd
//  * @param {number} inValue
//  * @returns {number} outValue
//  */
// function linMap(inStart, inEnd, outStart, outEnd, inValue) {
//     return lerp(outStart, outEnd, ilerp(inStart, inEnd, inValue));
// }

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
        const scaledPt = [pt[0] * scaleFactor, pt[1] * scaleFactor, pt[2] * scaleFactor];
        normalizedPoints.push(scaledPt);
    }
    return normalizedPoints;
}

// const DIMS = {
//     aspect: 1,
//     scaleX: 1,
//     scaleY: 1,
//     translateX: 0,
//     translateY: 0,
// };

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
    // DIMS.aspect = desHeight / desWidth;
    // DIMS.scaleX = desWidth / 2 * DIMS.aspect;
    // DIMS.scaleY = -desHeight / 2;
    // DIMS.translateX = desWidth / 2;
    // DIMS.translateY = desHeight / 2;
    // //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
    // ctx.setTransform(DIMS.scaleX, 0, 0, DIMS.scaleY, DIMS.translateX, DIMS.translateY);
}

// /**
//  * Draw a line with the current stroke color
//  * @param {number} x1
//  * @param {number} y1
//  * @param {number} x2
//  * @param {number} y2
//  * @returns {void}
//  */
// function line(x1, y1, x2, y2) {
//     ctx.beginPath();
//     ctx.moveTo(x1, y1);
//     ctx.lineTo(x2, y2);
//     ctx.stroke();
// }
// function shortestDistance(x1, y1, x2, y2, x3, y3) {
//     let px = x2 - x1;
//     let py = y2 - y1;
//     let temp = (px * px) + (py * py);
//     let u = ((x3 - x1) * px + (y3 - y1) * py) / (temp);
//     if (u > 1) {
//         u = 1;
//     }
//     else if (u < 0) {
//         u = 0;
//     }
//     let x = x1 + u * px;
//     let y = y1 + u * py;

//     let dx = x - x3;
//     let dy = y - y3;
//     let dist = Math.sqrt(dx * dx + dy * dy);
//     return dist;

// }

// let _fillStyle = null;
// let _strokeStyle = null;

// /**
//  * Draw a circle with the current fill color
//  * @param {number} x
//  * @param {number} y
//  * @param {number} radius
//  * @returns {void}
//  */
// function circle(x, y, radius) {
//     if (_fillStyle || _strokeStyle) {
//         ctx.beginPath();
//         ctx.ellipse(x, y, radius, radius, 0, 0, TAU);
//         if (_fillStyle) {
//             ctx.fill();
//         }
//         if (_strokeStyle) {
//             ctx.stroke();
//         }
//     }
// }

// /**
//  * Draw an ellipse with the current fill color
//  * @param {number} x
//  * @param {number} y
//  * @param {number} r1
//  * @param {number} r2
//  * @returns {void}
//  */
// function ellipse(x, y, r1, r2) {
//     if (_fillStyle || _strokeStyle) {
//         ctx.beginPath();
//         ctx.ellipse(x, y, r1, r2, 0, 0, TAU);
//         if (_fillStyle) {
//             ctx.fill();
//         }
//         if (_strokeStyle) {
//             ctx.stroke();
//         }
//     }
// }

// /**
//  * Set the fill color
//  * @param {string|number} color Fill color as a string or an RGBA integer (u32)
//  * @returns {void}
//  */
// function fill(color) {
//     _fillStyle = canvasColorFromNumberOrString(color);
//     ctx.fillStyle = _fillStyle;
// }

// function noFill() {
//     _fillStyle = null;
// }

// function noStroke() {
//     _strokeStyle = null;
// }

// /**
//  * Set the stroke color
//  * @param {string|number} color Stroke color as a string or an RGBA integer (u32)
//  * @returns {void}
//  */
// function stroke(color) {
//     _strokeStyle = canvasColorFromNumberOrString(color);
//     ctx.strokeStyle = _strokeStyle;
// }

// /**
//  * Set the stroke thickness
//  * @param {string} weight
//  * @returns {void}
//  */
// function strokeWeight(weight) {
//     ctx.lineWidth = weight;
// }

// /**
//  * Draw a rectangle with the current fill color
//  * @param {string} color
//  * @returns {void}
//  */
// function rect(x, y, width, height) {
//     if (_fillStyle || _strokeStyle) {
//         ctx.beginPath();
//         ctx.rect(x, y, width, height);
//         if (_fillStyle) {
//             ctx.fill();
//         }
//         if (_strokeStyle) {
//             ctx.stroke();
//         }
//     }
// }

// /**
//  * Given an integer (u32) representing an RGBA color,
//  * returns a canvas-compatible color string.
//  * @param {number} rgba 
//  * @returns {string}
//  */
// function canvasColorFromNumber(rgba) {
//     return `#${(rgba >>> 0).toString(16).padStart(8, '0')}`;
// }

// /**
//  * @param {string|number} color Color as a string or an RGBA integer (u32)
//  * @returns {string} Color as a canvas string
//  */
// function canvasColorFromNumberOrString(color) {
//     if (typeof (color) === 'string') {
//         return color;
//     } else if (typeof (color) === 'number') {
//         return canvasColorFromNumber(color);
//     }
// }

// /**
//  * Clear the full canvas with the given color.
//  * @param {string} color 
//  * @returns {void}
//  */
// function clear(color) {
//     const prevColor = ctx.fillStyle;
//     ctx.fillStyle = canvasColorFromNumberOrString(color);
//     rect(-DIMS.scaleX * 0.5, -DIMS.scaleY * 0.5, DIMS.scaleX, DIMS.scaleY);
//     ctx.fillStyle = prevColor;
// }

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

// /**
//  * @param x
//  * @param y
//  * @returns The length of a vector
//  */
// function length(x, y) {
//     return Math.sqrt(x * x + y * y);
// }

// /**
//  * @param x1
//  * @param y1
//  * @param x2
//  * @param y2
//  * @returns The squared distance between two points
//  */
// function sqrDist(x1, y1, x2, y2) {
//     return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
// }

// /**
//  * Set the text size in screen pixels.
//  * @param {number} size
//  * @returns {void}
//  */
// function textSize(size) {
//     ctx.font = `${size}px sans-serif`;
// }

// /**
//  * Draw the given `text` string at the specified
//  * x,y coordinate in normalized space.
//  * @param {string} text
//  * @param {number} x
//  * @param {number} y
//  * @returns {void}
//  */
// function text(text, x, y) {
//     const canvas = ctx.canvas;
//     const width = canvas.width;
//     const height = canvas.height;

//     const scale = 1;
//     ctx.setTransform(scale, 0, 0, scale, 0, 0);
//     ctx.fillText(text, width * (x * 0.5 * DIMS.aspect + 0.5), height * (0.5 - y * 0.5));
//     ctx.setTransform(DIMS.scaleX, 0, 0, DIMS.scaleY, DIMS.translateX, DIMS.translateY);
// }

// /**
//  * Returns the width of the given text 
//  * in the normalized coordinate system, using the current
//  * font size.
//  * @param {string} text
//  */
// function measureTextDims(text) {
//     const scale = 1;
//     ctx.setTransform(scale, 0, 0, scale, 0, 0);

//     const measurements = ctx.measureText(text);
//     const textWidth = measurements.width / DIMS.scaleX;
//     const textHeight = (measurements.actualBoundingBoxAscent - measurements.actualBoundingBoxDescent) / -DIMS.scaleY;

//     ctx.setTransform(DIMS.scaleX, 0, 0, DIMS.scaleY, DIMS.translateX, DIMS.translateY);
//     return [textWidth, textHeight];
// }

// class UserInterface {
//     /** @type {[x: number, y: number]} Position of the mouse in normalized coordinates. */
//     mousePosition = [0, 0];
//     /** @type {boolean} Was the mouse clicked this frame? */
//     mouseClicked = false;

//     COLOR_IDLE = 'black'
//     COLOR_HOVERED = 'green'
//     COLOR_ACTIVE = 'yellow'
//     COLOR_TEXT_IDLE = 'white'
//     COLOR_TEXT_HOVERED = 'black'

//     /**
//      * @param {CanvasRenderingContext2D} ctx
//      */
//     constructor(ctx) {
//         const canvas = ctx.canvas;

//         /**
//          * @param {MouseEvent} mouseEvent 
//          */
//         const _onMouseMove = (mouseEvent) => {
//             const width = canvas.clientWidth;
//             const height = canvas.clientHeight;
//             const aspect = height / width;
//             const scaleX = width / 2 * aspect;
//             const scaleY = -height / 2;
//             const translateX = width / 2;
//             const translateY = height / 2;
//             this.mousePosition[0] = (mouseEvent.clientX - translateX) / scaleX;
//             this.mousePosition[1] = (mouseEvent.clientY - translateY) / scaleY;
//         }

//         /**
//          * @param {MouseEvent} mouseEvent 
//          */
//         const _onMouseClick = (mouseEvent) => {
//             this.mouseClicked = true;
//         }

//         window.addEventListener('mousemove', _onMouseMove);
//         window.addEventListener('click', _onMouseClick);

//         this._removeListeners = () => {
//             window.removeEventListener('mousemove', _onMouseMove);
//             window.removeEventListener('click', _onMouseClick);
//         }
//     }

//     /**
//      * Is the mouse hovering over the given rectangle?
//      * @param {number} x Left normalized coordinate of the rect
//      * @param {number} y Bottom normalized coordinate of the rect
//      * @param {number} width Width of the rect in normalized coordinates
//      * @param {number} height Height of the rect in normalized coordinates
//      * @returns True if the mouse is over the rectangle.
//      */
//     isHoveringRect(x, y, width, height) {
//         const pos = this.mousePosition;
//         return pos[0] > x && pos[0] < x + width
//             && pos[1] > y && pos[1] < y + height;
//     }

//     /** 
//      * Draws an interactive button.
//      * @param {string} label Text to display on the button
//      * @param {number} x Normalized left coordinate of the button
//      * @param {number} y Normalized bottom coordinate of the button
//      * @returns {boolean} True if the button was clicked this frame
//      */
//     button(label, x, y) {
//         textSize(20);
//         const labelDims = measureTextDims(label);
//         const padding = 0.02;
//         const width = labelDims[0] + padding * 2;
//         const height = labelDims[1] + padding * 2;

//         const isHovered = this.isHoveringRect(x, y, width, height);
//         const wentDown = isHovered && this.mouseClicked;

//         fill(isHovered ? this.COLOR_HOVERED : this.COLOR_IDLE);
//         rect(x, y, width, height);
//         fill(isHovered ? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE);
//         text(label, x + padding, y + padding);

//         return wentDown;
//     }

//     /** 
//      * Draws an interactive button that has an active/inactive state.
//      * @param {string} label Text to display on the button
//      * @param {boolean} isActive Should the button appear "active" even if not hovered?
//      * @param {number} x Normalized left coordinate of the button
//      * @param {number} y Normalized bottom coordinate of the button
//      * @returns {boolean} True if the button was clicked this frame
//      */
//     toggleButton(label, isActive, x, y) {
//         textSize(20);
//         const labelDims = measureTextDims(label);
//         const padding = 0.02;
//         const width = labelDims[0] + padding * 2;
//         const height = labelDims[1] + padding * 2;

//         const isHovered = this.isHoveringRect(x, y, width, height);
//         const wentDown = isHovered && this.mouseClicked;

//         if (isHovered) {
//             fill(this.COLOR_HOVERED);
//         } else if (isActive) {
//             fill(this.COLOR_ACTIVE);
//         } else {
//             fill(this.COLOR_IDLE);
//         }
//         rect(x, y, width, height);

//         fill(isHovered || isActive ? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE);
//         text(label, x + padding, y + padding);

//         return wentDown;
//     }

//     /** 
//      * Must be called exactly once at the end of the frame.
//      * @returns {void}
//      */
//     onFrameEnd() {
//         this.mouseClicked = false;
//     }

//     /** 
//      * Remove all event listeners set up in the constructor.
//      * @returns {void}
//      */
//     cleanUp() {
//         this._removeListeners();
//     }
// }

class Vector3 extends Array {
    constructor(x, y, z) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    static from(x, y, z) {
        return new Vector3(x, y, z);
    }

    static zero() {
        return new Vector3(0, 0, 0);
    }
}

class Matrix4x4 extends Array {
    constructor(m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44) {
        super(16);
        this[0] = m11;
        this[1] = m21;
        this[2] = m31;
        this[3] = m41;

        this[4] = m12;
        this[5] = m22;
        this[6] = m32;
        this[7] = m42;

        this[8] = m13;
        this[9] = m23;
        this[10] = m33;
        this[11] = m43;

        this[12] = m14;
        this[13] = m24;
        this[14] = m34;
        this[15] = m44;
    }

    static from(m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44) {
        return new Matrix4x4(m11, m12, m13, m14,
            m21, m22, m23, m24,
            m31, m32, m33, m34,
            m41, m42, m43, m44);
    }

    static identity() {
        return new Matrix4x4(1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
    }

    static multiply(a, b) {
        const c = Matrix4x4.identity();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let cij = 0;
                for (let k = 0; k < 4; k++) {
                    cij += a[i + k * 4] * b[k + j * 4];
                }
                c[i + j * 4] = cij;
            }
        }
        return c;
    }

    times(b) {
        return Matrix4x4.multiply(this, b);
    }

    static add(a, b) {
        const c = Matrix4x4.identity();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                c[i * 4 + j] = a[i * 4 + j] + b[i * 4 + j];
            }
        }
        return c;
    }

    plus(b) {
        return Matrix4x4.add(this, b);
    }

    static subtract(a, b) {
        const c = Matrix4x4.identity();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                c[i * 4 + j] = a[i * 4 + j] - b[i * 4 + j];
            }
        }
        return c;
    }

    minus(b) {
        return Matrix4x4.subtract(this, b);
    }

    timesVector3([x, y, z]) {
        const res = Vector3.zero();
        const w = 1;
        for (let i = 0; i < 3; i++) {
            res[i] = this[i + 0 * 4] * x + this[i + 1 * 4] * y + this[i + 2 * 4] * z + this[i + 3 * 4] * w;
        }
        return res;
    }

    rotX(radians) {
        const mat = Matrix4x4.from(
            1, 0, 0, 0,
            0, Math.cos(radians), -Math.sin(radians), 0,
            0, Math.sin(radians), Math.cos(radians), 0,
            0, 0, 0, 1);
        return this.times(mat);
    }

    rotY(radians) {
        const mat = Matrix4x4.from(
            Math.cos(radians), 0, Math.sin(radians), 0,
            0, 1, 0, 0,
            -Math.sin(radians), 0, Math.cos(radians), 0,
            0, 0, 0, 1);
        return this.times(mat);
    }

    rotZ(radians) {
        const mat = Matrix4x4.from(
            Math.cos(radians), -Math.sin(radians), 0, 0,
            Math.sin(radians), Math.cos(radians), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        return this.times(mat);
    }
}

class Space {
    /**
     * Create a new space.
     * 
     * The screen coordinates are in a space where 0,0 is top left and 1,1 is bottom right
     * 
     * @param {CanvasRenderingContext2D} ctx - rendering canvas
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} screenWidth
     * @param {number} screenHeight
     * @param {number} initialYmin - initial minimum y value at the bottom of the space
     * @param {number} initialYmax - initial maximum y value at the top of the space
     */
    constructor(ctx, screenX, screenY, screenWidth, screenHeight, initialYmin = -1, initialYmax = -1, squareAspect = true) {
        this.ctx = ctx;
        this.screenX = screenX;
        this.screenY = screenY;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.initialYmin = initialYmin;
        this.initialYmax = initialYmax;
        this.squareAspect = squareAspect;

        this.scale = Vector3.from(1, 1, 1);
        this.translation = Vector3.from(0, 0, 0);
        this.rotation = Vector3.from(0, 0, 0);

        this.updateViewMatrix();
    }

    canvasColor(rgba) {
        if (typeof (rgba) === 'string') {
            return rgba;
        }
        return `#${(rgba >>> 0).toString(16).padStart(8, '0')}`;
    }

    updateViewMatrix() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        const left = canvas.width * this.screenX;
        const top = canvas.height * this.screenY;

        const minDim = Math.min(canvas.height, canvas.width);
        const xDim = this.squareAspect ? minDim : canvas.width;
        const yDim = this.squareAspect ? minDim : canvas.height;
        const zDim = this.squareAspect ? minDim : canvas.height;

        this.scale[0] = (xDim / ((this.initialYmax - this.initialYmin))) * this.screenWidth;
        this.scale[1] = -(yDim / ((this.initialYmax - this.initialYmin))) * this.screenHeight;
        this.scale[2] = zDim / (this.initialYmax - this.initialYmin);
        this.translation[0] = (canvas.width / (this.initialYmax - this.initialYmin) * this.screenWidth + left);
        this.translation[1] = canvas.height - (canvas.height / (this.initialYmax - this.initialYmin) * this.screenHeight + top);
        this.translation[2] = 0;
        const scaleMat = Matrix4x4.from(
            this.scale[0], 0, 0, 0,
            0, this.scale[1], 0, 0,
            0, 0, this.scale[2], 0,
            0, 0, 0, 1);

        const rot = this.rotation;
        let rotMat = Matrix4x4.identity();
        rotMat = rotMat.rotX(rot[0]);
        rotMat = rotMat.rotY(rot[1]);
        rotMat = rotMat.rotZ(rot[2]);

        const transMat = Matrix4x4.from(
            1, 0, 0, this.translation[0],
            0, 1, 0, this.translation[1],
            0, 0, 1, this.translation[2],
            0, 0, 0, 1);

        this.matrix = transMat.times(scaleMat).times(rotMat);
    }

    /**
     * Draw a line between `pt1` and `pt2` in this space.
     * You may optionally change the default color and style when drawing.
     * 
     * @example <caption>Draw line with default color and thickness:</caption>
     * space.line([1,1,1], [0,0,0]);
     * @example <caption>Changing the color to red:</caption>
     * space.line([1,1,1], [0,0,0], { color: 0xFF0000FF });
     * @example <caption>Changing the thickness to 2:</caption>
     * space.line([1,1,1], [0,0,0], { thickness: 2 });
     * @example <caption>Changing the color and thickness:</caption>
     * space.line([1,1,1], [0,0,0], { color: 0xFF0000FF, thickness: 2 });
     * 
     * @param {[x: number, y: number, z: number]} pt1 - coordinates of the first point
     * @param {[x: number, y: number, z: number]} pt2 - coordinates of the first point
     *
     * @param {Object} style - [Optional] style properties e.g. `{color: 'red', thickness: 2}`
     * @param {string|number} style.color - Color of the line
     * @param {number} style.thickness - Thickness of the line
     * 
     * @returns {void}
     */
    line(pt1, pt2, { color, thickness } = { color: 0xFF, thickness: 1 }) {
        const mat = this.matrix;
        const ctx = this.ctx;
        const a = mat.timesVector3(pt1);
        const b = mat.timesVector3(pt2);
        ctx.strokeStyle = this.canvasColor(color);
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
    }

    crosshairs(pt1, radius, { color, thickness } = { color: 0xFF, thickness: 1 }) {
        this.line([pt1[0] - radius, pt1[1], pt1[2]],
            [pt1[0] + radius, pt1[1], pt1[2]], { color, thickness });
        this.line([pt1[0], pt1[1] - radius, pt1[2]],
            [pt1[0], pt1[1] + radius, pt1[2]], { color, thickness });
        this.line([pt1[0], pt1[1], pt1[2] - radius],
            [pt1[0], pt1[1], pt1[2] + radius], { color, thickness });
    }

    rectXY(cornerPt, width, height, { color, thickness } = { color: 0xFF, thickness: 1 }) {
        this.line(cornerPt, [cornerPt[0] + width, cornerPt[1], cornerPt[2]], { color, thickness });
        this.line([cornerPt[0] + width, cornerPt[1], cornerPt[2]],
            [cornerPt[0] + width, cornerPt[1] + height, cornerPt[2]], { color, thickness });
        this.line([cornerPt[0] + width, cornerPt[1] + height, cornerPt[2]],
            [cornerPt[0], cornerPt[1] + height, cornerPt[2]], { color, thickness });
        this.line([cornerPt[0], cornerPt[1] + height, cornerPt[2]], cornerPt, { color, thickness });
    }

    sphere(centerPt, radius, { fill, stroke, thickness } = { fill: 0xFF, stroke: 0xFF, thickness: 1 }) {
        /** @type {CanvasRenderingContext2D} */
        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = mat.timesVector3(centerPt);
        const scaleX = Math.abs(this.scale[0]);
        const scaleY = Math.abs(this.scale[1]);
        ctx.beginPath();
        ctx.ellipse(pt[0], pt[1], radius * scaleX, radius * scaleY, 0, 0, Math.PI * 2);
        if (fill) {
            ctx.fillStyle = this.canvasColor(fill);
            ctx.fill();
        }
        if (stroke) {
            ctx.lineWidth = thickness;
            ctx.strokeStyle = this.canvasColor(stroke);
            ctx.stroke();
        }
    }

    drawLeds(positions, values, radii = 0.01) {
        for (let i = 0; i < positions.length; i++) {
            const color = 0xFF | values[i * 3 + 2] << 8 | values[i * 3 + 1] << 16 | values[i * 3 + 0] << 24;
            this.sphere(positions[i], radii, { fill: color, stroke: null });
        }
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

const updateWs = new WebSocket(`ws://${window.location.host}/update`);
updateWs.onmessage = (evt) => {
    console.log('MSG', evt);
    location.reload();
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
    normalized: [],
    /** @type {[x: number, y: number, z: number][]} flat array of data points in normalized coordinates */
    normalizedFlat: []
}


Promise.all(
    [fetch(`http://${window.location.host}/mappings/mappingPersp.json`).then((value) => value.json()),
    fetch(`http://${window.location.host}/mappings/mappingFlat.json`).then((value) => value.json())]
).then(([persp, flat]) => {
    mappings.physical = persp;
    mappings.normalized = mapPointsToNormalizedCoords(persp);
    mappings.normalizedFlat = mapPointsToNormalizedCoords(flat);

    state.data = new Uint8Array(persp.length * 3); // 3 bytes per LED, for Red, Green, Blue channels of each LED
});

// /**
//  * Load the given mapping file containing physical coordinates.
//  * Use it to initialize the nomalized mappings and the data `Uint8Array`.
//  */
// fetch(`http://${window.location.host}/mappings/mappingPersp.json`).then(async (value) => {
//     const physical = await value.json();
//     mappings.physical = physical;
//     mappings.normalized = mapPointsToNormalizedCoords(physical);

//     state.data = new Uint8Array(physical.length * 3); // 3 bytes per LED, for Red, Green, Blue channels of each LED
// });


/** Circle constant -- radians in a full circle */
const TAU = Math.PI * 2;

// const UI = new UserInterface(ctx);

/**
 * Animation tick function called repeatedly.
 * @param {number} elapsedMs Number of milliseconds elapsed since last tick
 * @param {Mappings} mappings 
 * @param {State} state 
 */
function tick(elapsedMs, { Front, Perspective, Top, GUI }, mappings, state) {
    // Front.sphere([0, 0, 0], 0.1, { fill: 'red', stroke: 'green', thickness: 2 });
    // Front.sphere([0, 0, 0.2], 0.05, { fill: 'red', stroke: 'green', thickness: 2 });

    const points = mappings.normalized;
    let x = Math.sin(elapsedMs * 0.0007);
    for (let i = 0; i < points.length; i++) {
        let pt = points[i];
        // let di = dist(x, 0, pt[0], pt[1]);
        let di = Math.abs(x - pt[0]);

        if (di < 0.5) {
            state.data[i * 3 + 0] = 255;
        } else {
            state.data[i * 3 + 0] = 0;
        }
    }



    Front.line([x, 0, 1], [x, 0, -1], { color: 'red', thickness: 6 });
    Perspective.line([x, 0, 1], [x, 0, -1], { color: 'red', thickness: 6 });
    Top.line([x, 0, 1], [x, 0, -1], { color: 'red', thickness: 6 });


    Perspective.rectXY([-0.5, -0.5, 0], 1, 1, { color: 0x000000FF, thickness: 1 });

    Front.drawLeds(mappings.normalized, state.data);
    Top.drawLeds(mappings.normalizedFlat, state.data);
    Perspective.drawLeds(mappings.normalized, state.data);
    // const pixelsToNorm = 1 / ctx.canvas.clientHeight;
    // const bottom = -1;
    // const top = 1;
    // const left = -1;
    // const right = 1;

    // strokeWeight(2 * pixelsToNorm);

    // // Background
    // clear('#ff00ffff');

    // fill('#000000ff');
    // if (dataWs.readyState === WebSocket.OPEN) {
    //     text(`Connected to Server`, -1, 0.9);
    // } else {
    //     text(`Not Connected to Server`, -1, 0.9);
    // }

    // // Origin Crosshairs
    // stroke('#ffffffff');
    // line(left, 0, right, 0);
    // line(0, bottom, 0, top);

    // noStroke();

    // const normMapping = mappings.normalized;

    // state.lineX += 0.01;
    // if (state.lineX > 1) {
    //     state.lineX = -1;
    // }
    // let lineXNorm = state.lineX;

    // for (let i = 0; i < normMapping.length; i++) {
    //     const pt = normMapping[i];

    //     // let x = (elapsedMs % 5000) / 5000 * right;

    //     // let di = dist(lineXNorm, 0, pt[0], pt[1]);
    //     // console.log(di);
    //     // line(x, 0, canvasPt[0], canvasPt[1]);
    //     // if (di < 0.5) {
    //     //     state.data[i * 3 + 0] = 255;
    //     // } else {
    //     //     state.data[i * 3 + 0] = 0;
    //     // }

    //     if (state.animState == 0) {
    //         line(lineXNorm, bottom, lineXNorm, top);
    //         let distToVerticalLine = Math.abs(pt[0] - lineXNorm);
    //         if (distToVerticalLine < 0.3) {
    //             //red
    //             state.data[i * 3 + 0] = 255;
    //         } else {
    //             state.data[i * 3 + 0] = 0;
    //         }
    //     }

    //     if (state.animState == 1) {
    //         strokeWeight(4 * pixelsToNorm);
    //         stroke('#ffffffff');
    //         noFill();
    //         let dia = (Math.sin(elapsedMs * 0.001) + 1) * 0.5;
    //         ellipse(0, 0, dia, dia);
    //         if (length(pt[0], pt[1]) < dia) {
    //             state.data[i * 3 + 0] = 255;
    //         } else {
    //             state.data[i * 3 + 0] = 0;
    //         }
    //     }


    //     if (state.animState == 2) {
    //         strokeWeight(4 * pixelsToNorm);
    //         stroke('#ffffffff');
    //         noFill();
    //         line(0, 0, Math.sin(elapsedMs * 0.001), Math.cos(elapsedMs * 0.001));
    //         let dist = shortestDistance(pt[0], pt[1], 0, 0, (Math.sin(elapsedMs * 0.001) - 0) / 2, (Math.cos(elapsedMs * 0.001) - 0) / 2);
    //         if (dist < 0.4) {
    //             state.data[i * 3 + 0] = 255;
    //         } else {
    //             state.data[i * 3 + 0] = 0;
    //         }
    //     }


    //     //green and blue
    //     state.data[i * 3 + 1] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
    //     state.data[i * 3 + 2] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
    // }

    // noStroke();
    // for (let i = 0; i < normMapping.length; i++) {
    //     const pt = normMapping[i];

    //     // Calculate the color of the current pixel:
    //     const color = 0xFF | state.data[i * 3 + 2] << 8 | state.data[i * 3 + 1] << 16 | state.data[i * 3 + 0] << 24;
    //     fill(color);
    //     circle(pt[0], pt[1], 0.01);
    // }

    // if (UI.toggleButton('Anim 1', state.animState == 0, -1, 0.5)) {
    //     state.animState = 0;
    // }
    // if (UI.toggleButton('Anim 2', state.animState == 1, -1, 0.4)) {
    //     state.animState = 1;
    // }
    // if (UI.toggleButton('Anim 3', state.animState == 2, -1, 0.3)) {
    //     state.animState = 2;
    // }

    if (dataWs.readyState === WebSocket.OPEN) {
        dataWs.send(state.data);
    }
}

/** @type HTMLCanvasElement */
const canvas = document.getElementById('visualization');
/** @type CanvasRenderingContext2D */
const ctx = canvas.getContext('2d');
// autoResize(ctx);

const spaces = {
    Front: new Space(ctx, 0, .5, 0.5, 0.5, -1, 1),
    Perspective: new Space(ctx, 0.5, .5, 0.5, 0.5, -1, 1),
    Top: new Space(ctx, 0, 0, 0.5, 0.5, -1, 1),
    GUI: new Space(ctx, 0.5, 0, 0.5, 0.5, -1, 1),
    Frames: new Space(ctx, 0, 0, 1, 1, -1, 1, /* squareAspect */ false),
}

/**
 * Main animation loop
 * @param {number} elapsedMs Number of milliseconds that elapsed since the last call.
 */
function mainLoop(elapsedMs) {
    autoResize(ctx);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    spaces.Perspective.rotation[0] = Math.sin(elapsedMs * 0.001);// -Math.PI / 1.5;
    spaces.Front.rotation[0] = -Math.PI / 2;
    spaces.Front.updateViewMatrix();
    spaces.Perspective.updateViewMatrix();
    spaces.Top.updateViewMatrix();
    spaces.GUI.updateViewMatrix();
    spaces.Frames.updateViewMatrix();

    spaces.Front.crosshairs([0, 0, 0], 1, { color: 0xFFFFFF, thickness: 0.5 });
    spaces.Top.crosshairs([0, 0, 0], 1, { color: 0xFFFFFF, thickness: 0.5 });
    spaces.Perspective.crosshairs([0, 0, 0], 1, { color: 0xFFFFFF, thickness: 0.5 });

    const frames = spaces.Frames;
    frames.rectXY([-1, -1, 0], 1, 1, { color: 0xFF, thickness: 2 });
    frames.rectXY([0, -1, 0], 1, 1, { color: 0xFF, thickness: 2 });
    frames.rectXY([0, 0, 0], 1, 1, { color: 0xFF, thickness: 2 });
    frames.rectXY([-1, 0, 0], 1, 1, { color: 0xFF, thickness: 2 });

    tick(elapsedMs, spaces, mappings, state);
    // UI.onFrameEnd();
    requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);