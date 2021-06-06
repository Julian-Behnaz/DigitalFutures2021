// @ts-check
'use strict';

/**
 * Computes the bounding box of a set of points, returning a 3d array where each element
 * is a 2d array containing the min and max extent of that dimension
 * @param {Vector3[]} dataPoints
 * @returns {[[minX:number,maxX:number], [minY:number,maxY:number], [minZ:number,maxZ:number]]}
 */
function computeBoundingBox(dataPoints) {
    // Initialize a bounding box that contains nothing:
    /** @type {[number, number]} */
    const minMaxX = [Infinity, -Infinity];
    /** @type {[number, number]} */
    const minMaxY = [Infinity, -Infinity];
    /** @type {[number, number]} */
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
 * @param {Vector3[]} dataPoints
 * @returns {Vector3[]}
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

    /** @type {Vector3[]} */
    const normalizedPoints = [];
    for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        /** @type {Vector3} */
        const scaledPt = [pt[0] * scaleFactor, pt[1] * scaleFactor, pt[2] * scaleFactor];
        normalizedPoints.push(scaledPt);
    }
    return normalizedPoints;
}

/**
 * Auto-resize the canvas to have the same number of pixels as the actual screen.
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
}

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
    /** 
     * @private
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    constructor(x, y, z) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    /**
     * Create a vector
     * @param {number} x - X coordinate of the new vector
     * @param {number} y - Y coordinate of the new vector
     * @param {number} z - Z coordinate of the new vector
     * @returns {Vector3} - A new vector
     */
    static create(x, y, z) {
        return new Vector3(x, y, z);
    }

    /**
     * Create an empty vector
     * @returns {Vector3} - A new zero vector
     */
    static zero() {
        return new Vector3(0, 0, 0);
    }
}

class Matrix4x4 extends Array {
    /**
     * @param {number} m11 
     * @param {number} m12 
     * @param {number} m13 
     * @param {number} m14 
     * @param {number} m21 
     * @param {number} m22 
     * @param {number} m23 
     * @param {number} m24 
     * @param {number} m31 
     * @param {number} m32 
     * @param {number} m33 
     * @param {number} m34 
     * @param {number} m41 
     * @param {number} m42 
     * @param {number} m43 
     * @param {number} m44 
     */
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

    /**
     * @param {number} m11 
     * @param {number} m12 
     * @param {number} m13 
     * @param {number} m14 
     * @param {number} m21 
     * @param {number} m22 
     * @param {number} m23 
     * @param {number} m24 
     * @param {number} m31 
     * @param {number} m32 
     * @param {number} m33 
     * @param {number} m34 
     * @param {number} m41 
     * @param {number} m42 
     * @param {number} m43 
     * @param {number} m44 
     * @returns {Matrix4x4}
     */
    static create(m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44) {
        return new Matrix4x4(m11, m12, m13, m14,
            m21, m22, m23, m24,
            m31, m32, m33, m34,
            m41, m42, m43, m44);
    }

    /**
     * Create a new identity matrix. When multiplying
     * the identity matrix with a vector, the vector is unchanged.
     * When multiplying identity matrix with another matrix, the matrix is unchanged.
     * @returns {Matrix4x4} - The identity matrix
     */
    static identity() {
        return new Matrix4x4(1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
    }

    /**
     * Multiply `a` and `b` together, returning a new matrix.
     * Note that the order in which you multiply matrices together changes the outcome.
     * @param {Matrix4x4} a 
     * @param {Matrix4x4} b 
     * @returns {Matrix4x4}
     */
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

    /**
     * Returns the result of multiplying `this` with `b`, returning a new matrix.
     * Note that the order in which you multiply matrices together changes the outcome.
     * @param {Matrix4x4} b 
     * @returns {Matrix4x4}
     */
    times(b) {
        return Matrix4x4.multiply(this, b);
    }

    /**
     * Returns a new matrix where each element is the sum of the corrseponding
     * elements of `a` and `b`.
     * @param {Matrix4x4} a 
     * @param {Matrix4x4} b 
     * @returns {Matrix4x4}
     */
    static add(a, b) {
        const c = Matrix4x4.identity();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                c[i * 4 + j] = a[i * 4 + j] + b[i * 4 + j];
            }
        }
        return c;
    }

    /**
     * Returns a new matrix where each element is the sum of the corrseponding
     * elements of `this` and `b`.
     * @param {Matrix4x4} b 
     * @returns {Matrix4x4}
     */
    plus(b) {
        return Matrix4x4.add(this, b);
    }

    /**
     * Returns a new matrix where each element is the difference of the corrseponding
     * elements of `a` and `b`.
     * @param {Matrix4x4} a
     * @param {Matrix4x4} b 
     * @returns {Matrix4x4}
     */
    static subtract(a, b) {
        const c = Matrix4x4.identity();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                c[i * 4 + j] = a[i * 4 + j] - b[i * 4 + j];
            }
        }
        return c;
    }

    /**
     * Returns a new matrix where each element is the difference of the corrseponding
     * elements of `this` and `b`.
     * @param {Matrix4x4} b 
     * @returns {Matrix4x4}
     */
    minus(b) {
        return Matrix4x4.subtract(this, b);
    }

    /**
     * Multiplies the matrix with a vector `vec`, transforming the vector by the matrix.
     * @param {Vector3} vec
     * @returns {Vector3}
     */
    timesVector3([x, y, z]) {
        const res = Vector3.zero();
        const w = 1;
        for (let i = 0; i < 3; i++) {
            res[i] = this[i + 0 * 4] * x + this[i + 1 * 4] * y + this[i + 2 * 4] * z + this[i + 3 * 4] * w;
        }
        return res;
    }

    /**
     * Returns a new matrix formed by rotating `this` around the x axis by `radians`.
     * @param {number} radians
     * @returns {Matrix4x4}
     */
    rotX(radians) {
        const mat = Matrix4x4.create(
            1, 0, 0, 0,
            0, Math.cos(radians), -Math.sin(radians), 0,
            0, Math.sin(radians), Math.cos(radians), 0,
            0, 0, 0, 1);
        return this.times(mat);
    }

    /**
     * Returns a new matrix formed by rotating `this` around the y axis by `radians`.
     * @param {number} radians
     * @returns {Matrix4x4}
     */
    rotY(radians) {
        const mat = Matrix4x4.create(
            Math.cos(radians), 0, Math.sin(radians), 0,
            0, 1, 0, 0,
            -Math.sin(radians), 0, Math.cos(radians), 0,
            0, 0, 0, 1);
        return this.times(mat);
    }

    /**
     * Returns a new matrix formed by rotating `this` around the z axis by `radians`.
     * @param {number} radians
     * @returns {Matrix4x4}
     */
    rotZ(radians) {
        const mat = Matrix4x4.create(
            Math.cos(radians), -Math.sin(radians), 0, 0,
            Math.sin(radians), Math.cos(radians), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        return this.times(mat);
    }
}

class Space {
    /**
     * Create a new space for drawing on the screen.
     * The space will appear with a corner at `screenX, screenY`
     * and dimensions `screenWidth` and `screenHeight`.
     * These coordinates exist in a space where 0,0 is the bottom left of the canvas
     * and 1,1 is the top right of the canvas.
     * 
     * @param {CanvasRenderingContext2D} ctx - rendering canvas
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} screenWidth
     * @param {number} screenHeight
     * @param {number} initialSpaceMin - initial minimum value at the edge of the space
     * @param {number} initialSpaceMax - initial maximum value at the edge of the space
     * @param {boolean} squareAspect - should the space be square? Defaults to `true`.
     */
    constructor(
        ctx,
        screenX,
        screenY,
        screenWidth,
        screenHeight,
        initialSpaceMin = -1,
        initialSpaceMax = -1,
        squareAspect = true) {
        this.ctx = ctx;
        this.screenX = screenX;
        this.screenY = screenY;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.initialSpaceMin = initialSpaceMin;
        this.initialSpaceMax = initialSpaceMax;
        this.squareAspect = squareAspect;

        this.scale = Vector3.create(1, 1, 1);
        this.translation = Vector3.create(0, 0, 0);
        this.rotation = Vector3.create(0, 0, 0);

        this.updateViewMatrix();
    }

    /**
     * Returns the given color converted to an HTML-canvas compatible color.
     * @private
     * @example
     * canvasColor(0xFF0000FF); // Red color
     * @example
     * canvasColor('green'); // Green color
     * @param {string|number} rgba - An HTML-canvas compatible color string or an unsigned 32 bit integer color in RGBA format.
     * @returns {string} - An HTML-canvas compatible color string
     */
    _canvasColor(rgba) {
        if (typeof (rgba) === 'string') {
            return rgba;
        }
        return `#${(rgba >>> 0).toString(16).padStart(8, '0')}`;
    }

    /**
     * Clear the region in which the space exists.
     * @returns {void}
     */
    clear() {
        const screenX = this.screenX;
        const screenY = this.screenY;
        const screenWidth = this.screenWidth;
        const screenHeight = this.screenHeight;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        ctx.clearRect(
            screenX * canvas.width, screenY * canvas.height,
            (screenX + screenWidth) * canvas.width, (screenY + screenHeight) * canvas.height);
    }

    /**
     * Fill the background of the space with the given color
     * @param {string|number} color
     * @returns {void}
     */
    background(color) {
        const screenX = this.screenX;
        const screenY = this.screenY;
        const screenWidth = this.screenWidth;
        const screenHeight = this.screenHeight;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        ctx.fillStyle = this._canvasColor(color);
        ctx.fillRect(
            screenX * canvas.width, screenY * canvas.height,
            (screenX + screenWidth) * canvas.width, (screenY + screenHeight) * canvas.height);
    }

    /**
     * Updates the view matrix based on the current canvas dimensions and the current rotation.
     * @returns {void}
     */
    updateViewMatrix() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        const left = canvas.width * this.screenX;
        const top = canvas.height * this.screenY;

        const minDim = Math.min(canvas.height, canvas.width);
        const xDim = this.squareAspect ? minDim : canvas.width;
        const yDim = this.squareAspect ? minDim : canvas.height;
        const zDim = this.squareAspect ? minDim : canvas.height;
        const spaceDif = this.initialSpaceMax - this.initialSpaceMin;
        const spaceOffset = ilerp(this.initialSpaceMin, this.initialSpaceMax, 0);

        this.scale[0] = (xDim / spaceDif) * this.screenWidth;
        this.scale[1] = -(yDim / spaceDif) * this.screenHeight;
        this.scale[2] = zDim / spaceDif;
        this.translation[0] = canvas.width * this.screenWidth * spaceOffset + left;
        this.translation[1] = canvas.height - (canvas.height * this.screenHeight * spaceOffset + top);
        this.translation[2] = 0;
        const scaleMat = Matrix4x4.create(
            this.scale[0], 0, 0, this.translation[0],
            0, this.scale[1], 0, this.translation[1],
            0, 0, this.scale[2], this.translation[2],
            0, 0, 0, 1);

        const rot = this.rotation;
        let rotMat = Matrix4x4.identity();
        rotMat = rotMat.rotX(rot[0]);
        rotMat = rotMat.rotY(rot[1]);
        rotMat = rotMat.rotZ(rot[2]);

        const transMat = Matrix4x4.create(
            1, 0, 0, this.translation[0],
            0, 1, 0, this.translation[1],
            0, 0, 1, this.translation[2],
            0, 0, 0, 1);

        // this.matrix = transMat.times(scaleMat).times(rotMat);
        this.matrix = (scaleMat).times(rotMat);
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
     * @param {Object} [style] - [Optional] style properties e.g. `{color: 'red', thickness: 2}`
     * @param {string|number} [style.color] - Color of the line
     * @param {number} [style.thickness] - Thickness of the line
     * 
     * @returns {void}
     */
    line(pt1, pt2, style = {}) {
        const color = style.color === undefined ? null : style.color;
        const thickness = style.thickness === undefined ? 0xFF : style.thickness;

        const mat = this.matrix;
        const ctx = this.ctx;
        const a = mat.timesVector3(pt1);
        const b = mat.timesVector3(pt2);
        ctx.strokeStyle = this._canvasColor(color);
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
    }

    /**
     * Draw 3d crosshairs.
     * 
     * @param {Vector3} centerPt - Center of the crosshairs.
     * @param {number} radius - Radius of the crosshairs.
     * @param {Object} [style] - [Optional] style properties e.g. `{color: 'red', thickness: 2}`
     * @param {string|number} [style.color] - Color of the crosshair lines
     * @param {number} [style.thickness] - Thickness of the crosshair lines
     * @returns {void}
     */
    crosshairs(centerPt, radius, style = {}) {
        const color = style.color === undefined ? null : style.color;
        const thickness = style.thickness === undefined ? 0xFF : style.thickness;

        this.line([centerPt[0] - radius, centerPt[1], centerPt[2]],
            [centerPt[0] + radius, centerPt[1], centerPt[2]], { color, thickness });
        this.line([centerPt[0], centerPt[1] - radius, centerPt[2]],
            [centerPt[0], centerPt[1] + radius, centerPt[2]], { color, thickness });
        this.line([centerPt[0], centerPt[1], centerPt[2] - radius],
            [centerPt[0], centerPt[1], centerPt[2] + radius], { color, thickness });
    }

    axes(radius, textSize, style = {}) {
        const stroke = style.stroke === undefined ? null : style.stroke;
        const fill = style.fill === undefined ? 'white' : style.fill;
        const thickness = style.thickness === undefined ? 0xFF : style.thickness;
        this.crosshairs([0, 0, 0], radius, { color: stroke, thickness });
        this.text(`+X`, textSize, [radius * 0.9, 0, 0], { fill });
        this.text(`-X`, textSize, [-radius * 0.9, 0, 0], { fill });
        this.text(`+Y`, textSize, [0, radius * 0.9, 0], { fill });
        this.text(`-Y`, textSize, [0, -radius * 0.9, 0], { fill });
        this.text(`+Z`, textSize, [0, 0, radius * 0.9], { fill });
        this.text(`-Z`, textSize, [0, 0, -radius * 0.9], { fill });
    }

    /**
     * Draw a rectangle in the xy plane.
     * 
     * @param {Vector3} cornerPt - Center of the crosshairs.
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle.
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the rectangle. `null` for no fill.
     * @param {string|number|null} [style.stroke] - Stroke color of the rectangle. `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the rectangle stroke
     * @returns {void}
     */
    rectXY(cornerPt, width, height, style = {}) {
        style.fill = style.fill === undefined ? null : style.fill;
        style.stroke = style.stroke === undefined ? 0xFF : style.stroke;
        style.thickness = style.thickness === undefined ? 0xFF : style.thickness;

        this.polygon([
            cornerPt,
            [cornerPt[0], cornerPt[1] + height, cornerPt[2]],
            [cornerPt[0] + width, cornerPt[1] + height, cornerPt[2]],
            [cornerPt[0] + width, cornerPt[1], cornerPt[2]],
        ], style);
    }

    /**
     * Draw a polygon via the given points.
     * 
     * @param {Vector3[]} points - Points of the polygon
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the polygon. `null` for no fill.
     * @param {string|number|null} [style.stroke] - Stroke color of the polygon. `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the polygon stroke
     * @returns {void}
     */
    polygon(points, style = {}) {
        const fill = style.fill === undefined ? null : style.fill;
        const stroke = style.stroke === undefined ? 0xFF : style.stroke;
        const thickness = style.thickness === undefined ? 0xFF : style.thickness;

        if (points.length > 0) {
            const mat = this.matrix;
            const ctx = this.ctx;
            const start = mat.timesVector3(points[0]);
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            for (let i = 1; i < points.length; i++) {
                const pt = mat.timesVector3(points[i]);
                ctx.lineTo(pt[0], pt[1]);
            }
            ctx.closePath();
            if (fill) {
                ctx.fillStyle = this._canvasColor(fill);
                ctx.fill();
            }
            if (stroke && thickness) {
                ctx.lineWidth = thickness;
                ctx.strokeStyle = this._canvasColor(stroke);
                ctx.stroke();
            }
        }
    }

    /**
     * Draw a sphere.
     * 
     * @param {Vector3} centerPt - Center of the sphere
     * @param {number} radius - Radius of the sphere
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the sphere. `null` for no fill.
     * @param {string|number|null} [style.stroke] - Stroke color of the sphere. `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the sphere's stroke
     * @returns {void}
     */
    sphere(centerPt, radius, style = {}) {
        const fill = style.fill === undefined ? null : style.fill;
        const stroke = style.stroke === undefined ? 0xFF : style.stroke;
        const thickness = style.thickness === undefined ? 0xFF : style.thickness;

        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = mat.timesVector3(centerPt);
        const scaleX = Math.abs(this.scale[0]);
        const scaleY = Math.abs(this.scale[1]);
        ctx.beginPath();
        ctx.ellipse(pt[0], pt[1], radius * scaleX, radius * scaleY, 0, 0, Math.PI * 2);
        if (fill) {
            ctx.fillStyle = this._canvasColor(fill);
            ctx.fill();
        }
        if (stroke && thickness) {
            ctx.lineWidth = thickness;
            ctx.strokeStyle = this._canvasColor(stroke);
            ctx.stroke();
        }
    }

    /**
     * Draw text
     * 
     * @param {string} text - The text to display
     * @param {number} size - Size of the text
     * @param {Vector3} position - Position of the text
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number} [style.fill] - Fill color of the text.
     * @returns {void}
     */
    text(text, size, position, style = {}) {
        const fill = style.fill === undefined ? 0xFF : style.fill;

        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = mat.timesVector3(position);

        const scaleX = Math.abs(this.scale[0]) * 0.01;

        ctx.font = `${size * scaleX}px sans-serif`;
        ctx.fillStyle = this._canvasColor(fill);
        ctx.fillText(text, pt[0], pt[1]);
    }

    /**
     * Draw leds as spheres at the given positions using the values as the colors.
     * 
     * @param {Vector3[]} positions - Positions of each LED
     * @param {Uint8Array} values - Each 3 values correspond to the R,G,B values of one LED. `values.length` must equal `3*positions.length`.
     * @param {number} [radii] - Radius of each LED
     * @returns {void}
     */
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
 * Mutable state that may be mutated by each animation tick.
 * `data` is of particular importance -- it will be sent to the server each frame.
 * The server will forward it to the microcontroller.
 * 
 * @typedef State
 * @property {Uint8Array} data - bytes representing LED colors. Every 3 bytes correspond to the Red, Green, and Blue channels of an LED.
 * The length of this `Uint8Array` should exactly match 3 times the total number of LEDs.
 */
const state = {
    data: new Uint8Array(0),
    lineX: 0,
    animState: 0
};

/**
 * @typedef {Object} Mappings
 * Mappings that express the relationship between data points in different coordinate systems.
 * The length of each array should correspond to the total number of LEDs.
 */
const mappings = {
    /** @type {Vector3[]} array of data points in physical coordinates */
    physical: [],
    /** @type {Vector3[]} corresponding array of data points in normalized coordinates */
    normalized: [],
    /** @type {Vector3[]} flat array of data points in normalized coordinates */
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

/** Circle constant -- radians in a full circle */
const TAU = Math.PI * 2;

// const UI = new UserInterface(ctx);

/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById('visualization');
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
// autoResize(ctx);

/**
 * @typedef {Object} Spaces
 * @property {Space} Front
 * @property {Space} Perspective
 * @property {Space} Top
 * @property {Space} GUI
 * @property {Space} Frames
 */
const spaces = {
    Front: new Space(ctx, 0, .5, 0.5, 0.5, -1, 1),
    Perspective: new Space(ctx, 0.5, .5, 0.5, 0.5, -1, 1),
    Top: new Space(ctx, 0, 0, 0.5, 0.5, -1, 1),
    GUI: new Space(ctx, 0.5, 0, 0.5, 0.5, -1, 1),
    Frames: new Space(ctx, 0, 0, 1, 1, 0, 1, /* squareAspect */ false),
}

/**
 * Main animation loop
 * @param {number} elapsedMs Number of milliseconds that elapsed since the last call.
 */
function mainLoop(elapsedMs) {
    autoResize(ctx);
    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    spaces.Perspective.rotation[0] = Math.sin(elapsedMs * 0.001);// -Math.PI / 1.5;
    spaces.Front.rotation[0] = -Math.PI / 2;
    spaces.Front.updateViewMatrix();
    spaces.Perspective.updateViewMatrix();
    spaces.Top.updateViewMatrix();
    spaces.GUI.updateViewMatrix();
    spaces.Frames.updateViewMatrix();
    spaces.Frames.background(0x333333FF);

    spaces.Front.axes(1, 6, { stroke: 0xFFFFFF, thickness: 0.5 });
    spaces.Top.axes(1, 6, { stroke: 0xFFFFFF, thickness: 0.5 });
    spaces.Perspective.axes(1, 6, { stroke: 0xFFFFFF, thickness: 0.5 });
    spaces.Front.text('Front', 12, [-0.9, 0, 0.9], { fill: 'white' });
    spaces.Top.text('Top', 12, [-0.9, 0, 0.9], { fill: 'white' });
    spaces.Perspective.text('Perspective', 12, [-0.9, 0, 0.9], { fill: 'white' });

    const frames = spaces.Frames;
    frames.rectXY([0, 0, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });
    frames.rectXY([0.5, 0, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });
    frames.rectXY([0.5, 0.5, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });
    frames.rectXY([0, 0.5, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });

    tick(elapsedMs, spaces, mappings, state);
    // UI.onFrameEnd();
    requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);


/**
 * Animation tick function called repeatedly.
 * @param {number} elapsedMs Number of milliseconds elapsed since last tick
 * @param {Spaces} spaces 
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


    Perspective.rectXY([-0.5, -0.5, 0], 1, 1, { stroke: 0xFF0000FF, thickness: 2 });

    Top.text(`${mappings.normalizedFlat.length}`, 12, [0, 0, 0], { fill: 'white' });
    Perspective.text(`${mappings.normalized.length}`, 12, [0, 0, 0], { fill: 'white' });

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