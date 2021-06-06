// @ts-check
'use strict';

/**
 * Computes the bounding box of a set of points, returning a 3d array where each element
 * is a 2d array containing the min and max extent of that dimension
 * @param {iVector3[]} dataPoints
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
 * @param {iVector3[]} dataPoints
 * @returns {[x: number, y: number, z: number][]}
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
        /** @type {[x: number, y: number, z: number]} */
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

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} The distance between two points
 */
function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}


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

/**
 * @typedef {[x: number, y: number, z: number]|Vector3|Array<number, 3>} iVector3
 */

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
     * Creates and returns a 3d vector filled with the passed parameters.
     * 
     * ```
     * |x|
     * |y|
     * |z|
     * ```
     * 
     * @param {number} x - X coordinate of the new vector
     * @param {number} y - Y coordinate of the new vector
     * @param {number} z - Z coordinate of the new vector
     * @returns {Vector3} - A new vector
     */
    static create(x, y, z) {
        return new Vector3(x, y, z);
    }

    static duplicate(vector) {
        return new Vector3(vector[0], vector[1], vector[1]);
    }

    /**
     * Sets the vector to have the given x,y,z values.
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    setValues(x, y, z) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    /**
     * Create and returns a 3d zero vector:
     * 
     * ```
     * |0|
     * |0|
     * |0|
     * ```
     * 
     * @returns {Vector3} - A new zero vector
     */
    static zero() {
        return new Vector3(0, 0, 0);
    }

    /**
     * Returns the result of adding the components of
     * the vectors `a` and `b`. If `out` is provided,
     * modifies it instead of creating a new vector. 
     * @param {iVector3} a 
     * @param {iVector3} b 
     * @param {Vector3} [out]
     * @return {Vector3}
     */
    static add(a, b, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
    }

    /**
     * Returns a new vector formed by adding `this` and `vector`.
     * @param {iVector3} vector
     * @returns {Vector3}
     */
    plus(vector) {
        return Vector3.add(this, vector);
    }

    /**
     * Modifies `out` with the result of subtracting the components of
     * the vector `b` from those of the vector `a`.
     * @param {iVector3} a 
     * @param {iVector3} b 
     * @param {Vector3} [out] 
     */
    static subtract(a, b, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    }

    /**
     * Returns a new vector formed by subtracting `vector` from `this`.
     * @param {iVector3} vector
     * @returns {Vector3}
     */
    minus(vector) {
        return Vector3.subtract(this, vector);
    }

    /**
     * Modifies `out` with the result of multiplying the components of
     * the vector `a` with `multiplier`.
     * @param {iVector3} a 
     * @param {number} multiplier 
     * @param {Vector3} [out]
     */
    static scaled(a, multiplier, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = a[0] * multiplier;
        out[1] = a[1] * multiplier;
        out[2] = a[2] * multiplier;
        return out;
    }

    /**
     * Returns a new vector formed by scaling `this` by multiplier.
     * @param {number} multiplier
     * @returns {Vector3}
     */
    scale(multiplier) {
        return Vector3.scaled(this, multiplier);
    }

    /**
     * Modifies `out` to be the normalized form of `vector`.
     * `out` will have a magnitude of 1
     * and point in the same direction as `this`.
     * 
     * If `vector` is the zero vector, sets `out` to the zero vector
     * instead of normalizing.
     * @param {iVector3} vector
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static normalize(vector, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const divisor = 1/Vector3.magnitude(vector);
        if (Number.isFinite(divisor)) {
            return Vector3.scaled(vector, 1/Vector3.magnitude(vector), out);
        } else {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
        }
    }

    /**
     * Returns a normalized copy of `this` vector.
     * The returned vector will have a magnitude of 1
     * and point in the same direction as `this`.
     * 
     * If `this` is the zero vector, returns a zero vector
     * instead of normalizing.
     * @returns {Vector3}
     */
    normalized() {
        return Vector3.normalize(this);
    }

    /**
     * Returns the length of `this`.
     * @returns {number}
     */
    getMagnitude() {
        return Vector3.magnitude(this);
    }

    /**
     * Returns the squared length of `this`.
     * @returns {number}
     */
    getSqrMagnitude() {
        return Vector3.sqrMagnitude(this);
    }

    /**
     * Returns the length of `vector`.
     * @param {iVector3} vector
     * @returns {number}
     */
    static magnitude(vector) {
        return Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1] + vector[2]*vector[2]);
    }

    /**
     * Returns the squared length of `vector`.
     * @param {iVector3} vector
     * @returns {number}
     */
    static sqrMagnitude(vector) {
        return vector[0]*vector[0] + vector[1]*vector[1] + vector[2]*vector[2];
    }
}

class Matrix4x4 extends Array {
    /**
     * @private
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
        this.setValues(m11, m12, m13, m14,
            m21, m22, m23, m24,
            m31, m32, m33, m34,
            m41, m42, m43, m44);
    }

    /**
     * Creates a new matrix initialized with the
     * passed parameters.
     * Matrix will have the form:
     * 
     * ```
     * | m11 m12 m13 m14 |
     * | m21 m22 m23 m24 |
     * | m31 m32 m33 m34 |
     * | m41 m42 m43 m44 |
     * ```
     *
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
     * Modifies every value of the matrix
     * to match the parameters passed in.
     * Matrix will have the form:
     * 
     * ```
     * | m11 m12 m13 m14 |
     * | m21 m22 m23 m24 |
     * | m31 m32 m33 m34 |
     * | m41 m42 m43 m44 |
     * ```
     *
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
     * @returns {void}
     */
    setValues(m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44) {
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
     * Create a new identity matrix. When multiplying
     * the identity matrix with a vector, the vector is unchanged.
     * When multiplying identity matrix with another matrix, the matrix is unchanged.
     * 
     * The identity matrix looks like this:
     * ```
     * | 1 0 0 0 |
     * | 0 1 0 0 |
     * | 0 0 1 0 |
     * | 0 0 0 1 |
     * ```
     * 
     * @returns {Matrix4x4} - The identity matrix
     */
    static identity() {
        return new Matrix4x4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
    }

    /**
     * Returns a copy of `matrix`. If `out` is provided,
     * modifies it rather than creating a new matrix.
     * @param {Matrix4x4} matrix 
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static copy(matrix, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        for (let i = 0; i < 16; i++) {
            out[i] = matrix[i];
        }
        return out;
    }

    /**
     * Returns a copy of this matrix. If `out` is provided,
     * modifies it rather than creating a new matrix.
     * @param {Matrix4x4} [out]
     * @returns {Matrix4x4}
     */
    duplicated(out) {
        return Matrix4x4.copy(this, out);
    }

    /**
     * Returns the result of multiplying `a` and `b` together.
     * Note that the order in which you multiply matrices together changes the outcome.
     * If `out` is provided, modifies it rather than creating a new matrix.
     * @param {Matrix4x4} a 
     * @param {Matrix4x4} b 
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static multiply(a, b, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        const res = Matrix4x4.__temp;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let cij = 0;
                for (let k = 0; k < 4; k++) {
                    cij += a[i + k * 4] * b[k + j * 4];
                }
                res[i + j * 4] = cij;
            }
        }
        Matrix4x4.copy(res, out);
        return out;
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
     * @param {iVector3} vector
     * @returns {Vector3}
     */
    timesVector3(vector) {
        const res = Vector3.zero();
        Matrix4x4.multiplyVector3(this, vector, /* out */res);
        return res;
    }

    /**
     * Multiplies the `matrix` with `vector`, transforming the vector by the matrix.
     * If `out` is supplied, overwrites it to store the result.
     * @param {Matrix4x4} matrix
     * @param {iVector3} vector
     * @param {Vector3} [out] - if present, overwritten with the result
     * @returns {Vector3}
     */
    static multiplyVector3(matrix, vector, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const x = vector[0];
        const y = vector[1];
        const z = vector[2];
        const w = 1;
        for (let i = 0; i < 3; i++) {
            out[i] = matrix[i + 0 * 4] * x + matrix[i + 1 * 4] * y + matrix[i + 2 * 4] * z + matrix[i + 3 * 4] * w;
        }
        return out;
    }

    /**
     * Returns a new matrix formed by rotating `this` around the x axis by `radians`.
     * @param {number} radians - Angle to rotate by
     * @returns {Matrix4x4}
     */
    rotX(radians) {
        const mat = Matrix4x4.__temp;
        Matrix4x4.fromXRotation(radians, mat);
        return Matrix4x4.multiply(this, mat);
    }

    /**
     * Returns a rotation matrix that rotates around the x
     * axis by `radians`. If `out` is provided, modifies it
     * rather than creating a new matrix.
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static fromXRotation(radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        out.setValues(
            1, 0, 0, 0,
            0, Math.cos(radians), -Math.sin(radians), 0,
            0, Math.sin(radians), Math.cos(radians), 0,
            0, 0, 0, 1);
        return out;
    }

    /**
     * Returns a new matrix formed by rotating `this` around the y axis by `radians`.
     * @param {number} radians
     * @returns {Matrix4x4}
     */
    rotY(radians) {
        const mat = Matrix4x4.__temp;
        Matrix4x4.fromYRotation(radians, mat);
        return Matrix4x4.multiply(this, mat);
    }

    /**
     * Returns a rotation matrix that rotates around the z
     * axis by `radians`. If `out` is provided, modifies it
     * rather than creating a new matrix.
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
     static fromYRotation(radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        out.setValues(
            Math.cos(radians), 0, Math.sin(radians), 0,
            0, 1, 0, 0,
            -Math.sin(radians), 0, Math.cos(radians), 0,
            0, 0, 0, 1);
        return out;
    }

    /**
     * Returns a new matrix formed by rotating `this` around the z axis by `radians`.
     * @param {number} radians - Angle to rotate by
     * @returns {Matrix4x4}
     */
    rotZ(radians) {
        const mat = Matrix4x4.__temp;
        Matrix4x4.fromZRotation(radians, mat);
        return Matrix4x4.multiply(this, mat);
    }

    /**
     * Returns a rotation matrix that rotates around the z
     * axis by `radians`. If `out` is provided, overwrites it
     * rather than creating a new matrix.
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out]
     * @returns {Matrix4x4}
     */
     static fromZRotation(radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();    
        }
        out.setValues(
            Math.cos(radians), -Math.sin(radians), 0, 0,
            Math.sin(radians), Math.cos(radians), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        return out;
    }
}
/**
 * @private
 * DO NOT USE.
 * Internal temporary matrix used to reduce
 * allocations when doing matrix math.
 */
// @ts-ignore
Matrix4x4.__temp = Matrix4x4.identity();

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
        this.matrix = Matrix4x4.identity();

        this.__tempP1 = Vector3.zero();
        this.__tempP2 = Vector3.zero();

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
        this.matrix.setValues(
            this.scale[0], 0, 0, this.translation[0],
            0, this.scale[1], 0, this.translation[1],
            0, 0, this.scale[2], this.translation[2],
            0, 0, 0, 1);

        const rot = this.rotation;
        let rotMat = Matrix4x4.identity();
        rotMat = rotMat.rotX(rot[0]);
        rotMat = rotMat.rotY(rot[1]);
        rotMat = rotMat.rotZ(rot[2]);

        // const transMat = Matrix4x4.create(
        //     1, 0, 0, this.translation[0],
        //     0, 1, 0, this.translation[1],
        //     0, 0, 1, this.translation[2],
        //     0, 0, 0, 1);

        // this.matrix = transMat.times(scaleMat).times(rotMat);
        this.matrix = (this.matrix).times(rotMat);
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
        const thickness = style.thickness === undefined ? 1 : style.thickness;

        const mat = this.matrix;
        const ctx = this.ctx;

        const a = Matrix4x4.multiplyVector3(mat, pt1, /* out */this.__tempP1);
        const b = Matrix4x4.multiplyVector3(mat, pt2, /* out */this.__tempP2);
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
     * @param {iVector3} centerPt - Center of the crosshairs.
     * @param {number} radius - Radius of the crosshairs.
     * @param {Object} [style] - [Optional] style properties e.g. `{color: 'red', thickness: 2}`
     * @param {string|number} [style.color] - Color of the crosshair lines
     * @param {number} [style.thickness] - Thickness of the crosshair lines
     * @returns {void}
     */
    crosshairs(centerPt, radius, style = {}) {
        const color = style.color === undefined ? null : style.color;
        const thickness = style.thickness === undefined ? 1 : style.thickness;

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
        const thickness = style.thickness === undefined ? 1 : style.thickness;
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
     * @param {iVector3} cornerPt - Center of the crosshairs.
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
     * @param {iVector3[]} points - Points of the polygon
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the polygon. `null` for no fill.
     * @param {string|number|null} [style.stroke] - Stroke color of the polygon. `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the polygon stroke
     * @returns {void}
     */
    polygon(points, style = {}) {
        const fill = style.fill === undefined ? null : style.fill;
        const stroke = style.stroke === undefined ? 0xFF : style.stroke;
        const thickness = style.thickness === undefined ? 1 : style.thickness;

        if (points.length > 0) {
            const mat = this.matrix;
            const ctx = this.ctx;
            const start = Matrix4x4.multiplyVector3(mat, points[0], /* out */this.__tempP1);
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            for (let i = 1; i < points.length; i++) {
                const pt = Matrix4x4.multiplyVector3(mat, points[i], /* out */this.__tempP1);
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
     * @param {iVector3} centerPt - Center of the sphere
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
        const thickness = style.thickness === undefined ? 1 : style.thickness;

        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = Matrix4x4.multiplyVector3(mat, centerPt, /* out */this.__tempP1);
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
     * @param {number} size - Font size
     * @param {iVector3} position - Position of the text
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number} [style.fill] - Fill color of the text.
     * @returns {void}
     */
    text(text, size, position, style = {}) {
        const fill = style.fill === undefined ? 0xFF : style.fill;

        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = Matrix4x4.multiplyVector3(mat, position, /* out */this.__tempP1);

        const scaleX = Math.abs(this.scale[0]) * 0.01;

        ctx.font = `${size * scaleX}px sans-serif`;
        ctx.fillStyle = this._canvasColor(fill);
        ctx.fillText(text, pt[0], pt[1]);
    }

    /**
     * Returns the width and height of the given
     * `text` with the specified font `size`.
     * 
     * @param {string} text - The text to display
     * @param {number} size - Font size
     * @returns {[width: number, height: number]}
     */
    measureText(text, size) {
        const ctx = this.ctx;
        const scaleX = Math.abs(this.scale[0]);
        const scaleY = Math.abs(this.scale[1]);
        ctx.font = `${size * 0.01 * scaleX}px sans-serif`;
        const measurements = ctx.measureText(text);

        const textWidth = measurements.width / scaleX;
        const textHeight = (measurements.actualBoundingBoxAscent - measurements.actualBoundingBoxDescent) / scaleY;
        return [textWidth, textHeight];
    }

    /**
     * Draw leds as spheres at the given positions using the values as the colors.
     * 
     * @param {iVector3[]} positions - Positions of each LED
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

class Spaces {
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    constructor(ctx){
        this.Front = new Space(ctx, 0, .5, 0.5, 0.5, -1, 1);
        this.Perspective = new Space(ctx, 0.5, .5, 0.5, 0.5, -1, 1);
        this.Top = new Space(ctx, 0, 0, 0.5, 0.5, -1, 1);
        this.GUI = new Space(ctx, 0.5, 0, 0.5, 0.5, -1, 1);
        this.Frames = new Space(ctx, 0, 0, 1, 1, 0, 1, /* squareAspect */ false);
    }
}

class State {
    constructor() {
        /** Data that encodes the color of each LED. Every 3 entries in the array correspond to the R,G,B values of one LED. */
        this.data = new Uint8Array(0)
        this.reset();
        this.tryRestoreFromSave();

        this.statusWs = new WebSocket(`ws://${window.location.host}/status`);
        this.statusWs.onopen = (evt) => {
            console.log('OPEN');
        };
        this.statusWs.onmessage = (evt) => {
            console.log('MSG', evt);
        };
        
        this.dataWs = new WebSocket(`ws://${window.location.host}/data`);
        this.dataWs.onopen = (evt) => {
            console.log('OPEN');
        };
        this.dataWs.onclose = (evt) => {
            console.log('CLOSED');
        };
        this.dataWs.onmessage = (evt) => {
            console.log('MSG', evt);
        };
        
        this.updateWs = new WebSocket(`ws://${window.location.host}/update`);
        this.updateWs.onmessage = (evt) => {
            // We got a message that a file changed.
            // Reload the browser, but save any state that should persist between
            // reloads.
            console.log('MSG', evt);
            this.savePreReload();
            location.reload();
        };
    }

    /**
     * Reset the state of all values that persist between reloads
     */
    reset() {
        this.animState = 0;
        this.lineX = 0;
    }

    /**
     * Save any data that should persist between reloads.
     */
    savePreReload() {
        localStorage.setItem(State.STORAGE_KEY, JSON.stringify({
            animState: this.animState,
            lineX: this.lineX,
        }));
    }

    /**
     * Restore any data we persisted.
     */
    tryRestoreFromSave() {
        const storedStr = localStorage.getItem(State.STORAGE_KEY);
        if (storedStr) {
            try {
                const stored = JSON.parse(storedStr);
                this.animState = stored.animState;
                this.lineX = stored.lineX;
            } catch (error) {
                localStorage.removeItem(State.STORAGE_KEY);
            }
        }
    }

    /**
     * Send the passed data to the server, which will pass it
     * on to the microcontroller if there is a connected microcontroller.
     * 
     * @param {Uint8Array} data
     */
    trySendToMicrocontroller(data) {
        if (this.dataWs.readyState === WebSocket.OPEN) {
            this.dataWs.send(data);
        }
    }
}
State.STORAGE_KEY = 'InstallationState';

/**
 * Mappings that express the relationship between data points in different coordinate systems.
 * The length of each stored array should correspond to the total number of LEDs.
 */
class Mappings {
    /** @param {State} state */
    constructor(state) {
        /** @type {iVector3[]} array of data points in physical coordinates */
        this.physical = [];
        /** @type {iVector3[]} corresponding array of data points in normalized coordinates */
        this.normalized = [];
        /** @type {iVector3[]} flat array of data points in normalized coordinates */
        this.normalizedFlat = [];

        Promise.all(
            [fetch(`http://${window.location.host}/mappings/mappingPersp.json`).then((value) => value.json()),
            fetch(`http://${window.location.host}/mappings/mappingFlat.json`).then((value) => value.json())]
        ).then(([persp, flat]) => {
            this.physical = persp;
            this.normalized = mapPointsToNormalizedCoords(persp);
            this.normalizedFlat = mapPointsToNormalizedCoords(flat);
        
            state.data = new Uint8Array(persp.length * 3); // 3 bytes per LED, for Red, Green, Blue channels of each LED
        });
    }
}

/** Circle constant -- radians in a full circle */
const TAU = Math.PI * 2;

// const UI = new UserInterface(ctx);

const state = new State();
const mappings = new Mappings(state);
/** @type {HTMLCanvasElement} */
const canvas = (/** @type {HTMLCanvasElement} */document.getElementById('visualization'));
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
autoResize(ctx);
const spaces = new Spaces(ctx);


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
 * Animation tick function. Called at the screen refresh rate (typically 60x per second).
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
    Front.text(`${state.animState}`, 12, [-1, 0, -1], { fill: 'white' });
    // state.animState++;
    const [w, h] = Front.measureText(`${state.animState}`, 12);
    Front.line([-1, 0, -1], [-1+w, 0, -1+h], {color: 'red', thickness:1});
    
    
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

    state.trySendToMicrocontroller(state.data);
}