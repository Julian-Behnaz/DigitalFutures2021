// @ts-check
'use strict';

/********************************************************************************************************************************
*********************************************************************************************************************************
* 👋👋🏻👋🏼👋🏽👋🏾👋🏿
* Hi! Welcome to the Installation Visualizer!
* 👋👋🏻👋🏼👋🏽👋🏾👋🏿
*
* This file is where you'll spend most of your time writing animations.
* It provides a bunch of useful functionality for:
* - streaming data to a microcontroller via a webserver
* - drawing animated things in different 3D views
* - making a simple UI for tweaking values
* - automatically updating your browser window when a file changes
* - saving values between updates/reloads so you don't lose your tweaks
* 
*
* If you haven't yet, make sure to
* ```
* npm run start
* ```
* inside the `/server` folder in this repository to start the visualizer running.
*
* Once you're ready,
* @see {Playground} to start coding!
* Psst... 👆 That's a link to the bottom of the file. Command+click the word "Playground" (or control+click on Windows/Linux)
* to jump to it.
*
* We hope you have fun!
* - Julian and Behnaz
*********************************************************************************************************************************
*********************************************************************************************************************************/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Common Mathematical Functions and Constants
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** 
 * Universal circle constant τ. Represents the number of radians in a full turn.
 */
const TAU = Math.PI * 2;

/**
 * @override
 * Returns the sine of a number.
 * @param {number} radians A numeric expression that contains an angle measured in radians.
 */
const sin = Math.sin;

/**
 * Returns the cosine of a number.
 * @param {number} radians A numeric expression that contains an angle measured in radians.
 */
const cos = Math.cos;

/**
 * Returns the counterclockwise angle between
 * - the line segment from `<0,0>` to `<1,0>`
 * - and the line segment from `<0,0>` to `<x,y>`
 * The result will be between `-TAU/2` and `TAU/2`.
 * 
 * Be careful! The first parameter is `y` and not `x`!
 * @param {number} y
 * @param {number} x
 * @returns {number}
 */
const atan2 = Math.atan2;

/**
 * Returns the absolute value of `value`
 * @param {number} value
 * @returns {number}
 */
const abs = Math.abs;

/**
 * Returns the minimum of `a` and `b`.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const min = Math.min;

/**
 * Returns the maximum of `a` and `b`.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const max = Math.max;

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
 * Returns the result of clamping value between `lo` and `hi`.
 * - If `value` <= lo, returns `lo`.
 * - If `value` >= hi, returns `hi`.
 * - Else returns `value`.
 * @param {number} lo
 * @param {number} hi
 * @param {number} value
 * @returns {number} clamped value between `lo` and `hi`
 */
function clamp(lo, hi, value) {
    return Math.min(Math.max(value, lo), hi);
}

/**
 * Returns the result of clamping value between `0` and `1`.
 * @param {number} value
 * @returns {number} clamped value between `0` and `1`
 */
function clamp01(value) {
    return Math.min(Math.max(value, 0), 1);
}

/**
 * Copies the sign (- or +) from `signSource` and
 * returns `value` with the sign of `signSource`.
 * - If `signSource` is negative, returns `-abs(value)`
 * - If `signSource` is positive, returns `abs(value)`
 * @param {number} value
 * @param {number} signSource
 * @returns {number}
 */
function copySign(value, signSource) {
    return signSource < 0 ? -abs(value) : abs(value);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {[x: number, y: number, z: number]|Vector3|Array<number, 3>} iVector3
 */

/**
 * A Vector class with helper methods for adding, subtracting, scaling, lerping,
 * and otherwise manipulating 3D vectors.
 * 
 * A Vector has a direction and a magnitude, but no position.
 * You can use vectors to represent positions if you consider the vector as describing
 * a translation from the origin at `<0,0,0>` to a point.
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
     * Returns the distance between two vectors
     * @param {iVector3} a 
     * @param {iVector3} b 
     * @returns {number}
     */
    static distance(a, b) {
        return Vector3.subtract(a, b, Vector3.__temp).getMagnitude();
    }

    /**
     * Returns the distance to the given `vector`
     * @param {iVector3} vector
     * @returns {number}
     */
    distTo(vector) {
        return Vector3.distance(this, vector);
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

    /**
     * Copies the `vector` and returns the copy.
     * If `out` is provided, modifies it rather than creating a new vector.
     * @param {iVector3} vector
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static copy(vector, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = vector[0];
        out[1] = vector[1];
        out[2] = vector[2];
        return out;
    }

    /**
     * Returns a new vector with the same values as `this`.
     * If `out` is provided, modifies it rather than creating a new vector.
     * @param {Vector3} out - [OPTIONAL] Modified if provided
     * @returns {Vector3}
     */
    duplicated(out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        return Vector3.copy(this, out);
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
     * @param {Vector3} [out] - [OPTIONAL] modified if provided
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
     * Returns the result of adding the components of
     * the vector `b` from the corresponding components of `a`. 
     * If `out` is provided, modifies it instead of creating a new vector.
     * @param {iVector3} a 
     * @param {iVector3} b 
     * @param {Vector3} [out] - [OPTIONAL] modified if provided
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
     * Returns the vector formed by scaling `a` by `multiplier`.
     * If `out` is provided, modifies it instead of creating a new vector.
     * @param {iVector3} a 
     * @param {number} multiplier 
     * @param {Vector3} [out] - [OPTIONAL] modified if provided
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
     * Normalizes `vector` without modifying it.
     * Returns a vector with the resulting normalized vector, which will 
     * have a magnitude of `1` and point in the same direction as `vector`.
     * If `out` is provided, modifies it rather than creating a new
     * vector.
     * 
     * If `vector` is the zero vector, returns the zero vector
     * instead of normalizing.
     * @param {iVector3} vector
     * @param {Vector3} [out] - [OPTIONAL] modified if provided
     * @returns {Vector3}
     */
    static normalize(vector, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const divisor = 1 / Vector3.magnitude(vector);
        if (Number.isFinite(divisor)) {
            Vector3.scaled(vector, divisor, out);
        } else {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
        }
        return out;
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
       * Returns the length of `vector`.
       * @param {iVector3} vector
       * @returns {number}
       */
    static magnitude(vector) {
        return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
    }

    /**
     * Returns the length of `this`.
     * @returns {number}
     */
    getMagnitude() {
        return Vector3.magnitude(this);
    }

    /**
     * Returns the squared length of `vector`.
     * @param {iVector3} vector
     * @returns {number}
     */
    static sqrMagnitude(vector) {
        return vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2];
    }

    /**
     * Returns the squared length of `this`.
     * @returns {number}
     */
    getSqrMagnitude() {
        return Vector3.sqrMagnitude(this);
    }

    /**
     * Returns the dot product of `a` and `b`.
     * @param {iVector3} a
     * @param {iVector3} b
     * @returns {number}
     */
    static dotProduct(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    /**
     * Returns the dot product of `this` and `vector`.
     * @param {iVector3} vector
     * @returns {number}
     */
    dot(vector) {
        return Vector3.dotProduct(this, vector);
    }

    /**
     * Returns the cross product of `a` and `b`.
     * @param {iVector3} a
     * @param {iVector3} b
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static crossProduct(a, b, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = a[1] * b[2] - a[2] * b[1];
        out[1] = a[2] * b[0] - a[0] * b[2];
        out[2] = a[0] * b[1] - a[1] * b[0];
        return out;
    }

    /**
     * Returns the cross product of `this` and `vector`.
     * @param {iVector3} vector
     * @returns {Vector3}
     */
    cross(vector) {
        return Vector3.crossProduct(this, vector);
    }

    /**
     * Lerps between `a` and `b` by t.
     * @param {iVector3} a
     * @param {iVector3} b
     * @param {number} t
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static lerp(a, b, t, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = lerp(a[0], b[0], t);
        out[1] = lerp(a[1], b[1], t);
        out[2] = lerp(a[2], b[2], t);
        return out;
    }

    /**
     * Returns the `t` value that would make `Vector3.lerp(a, b, t)` return `vector`.
     * @param {iVector3} a
     * @param {iVector3} b
     * @param {iVector3} vector
     * @returns {number}
     */
    static ilerp(a, b, vector) {
        return (vector[0] - a[0]) * (b[0] - a[0]) + (vector[1] - a[1]) * (b[1] - a[1]) + (vector[2] - a[2]) * (b[2] - a[2]);
    }

    /**
     * Returns a vector that is perpendicular to `vector`.
     * There are an infinite number of possible perpendicular vectors.
     * This chooses one and returns it.
     * @param {iVector3} vector
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static somePerpendicular(vector, out) {
        // See https://math.stackexchange.com/questions/137362/how-to-find-perpendicular-vector-to-another-vector
        if (out === undefined) {
            out = Vector3.zero();
        }
        out[0] = copySign(vector[2], vector[0]);
        out[1] = copySign(vector[2], vector[1]);
        out[2] = -copySign(vector[0], vector[2]) - copySign(vector[1], vector[2]);
        return out;
    }
}
/**
 * @private
 * DO NOT USE.
 * Internal temporary vector used to reduce
 * allocations when doing vector math.
 */
// @ts-ignore
Vector3.__temp = Vector3.zero();

/**
 * A Matrix class with helper methods for multiplying, adding, subtracting, rotating,
 * and otherwise manipulating 4x4 matrices.
 * 
 * *You likely won't need to use this class directly.*
 * 
 * This framework is primarily concerned with "homogenous" 4x4 matrices, which
 * we can use to translate, rotate, and scale vectors and other matrices.
 * Such a matrix has this form, where `I`, `J`, and `K` define the orthogonal basis vectors
 * of a space, which allow you to represent rotation and scale, and
 * the `T` vector defines a translation.
 * 
 * ```
 * | Ix Jx Kx Tx |
 * | Iy Jy Ky Ty |
 * | Iz Jz Kz Tz |
 * | 0  0  0  1  |
 * ```
 * 
 * You can find out more about matrices from the great Essence of Linear Algebra series. 
 * https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
 */
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
    constructor(
        m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44) {
        super(16);
        this.setValues(
            m11, m12, m13, m14,
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
    static create(
        m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44) {
        return new Matrix4x4(
            m11, m12, m13, m14,
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
    setValues(
        m11, m12, m13, m14,
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
     * the identity matrix with a vector, the result is the vector you started with.
     * When multiplying identity matrix with another matrix, the result is the matrix you started with. 
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
     * Sets the matrix to the identity matrix.
     * @returns {void}
     */
    setToIdentity() {
        this.setValues(
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
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    duplicated(out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
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
        const res = Matrix4x4.__temp2;
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
     * Returns the result of multiplying `this` with `matrix`, returning a new matrix.
     * Note that the order in which you multiply matrices together changes the outcome.
     * @param {Matrix4x4} matrix 
     * @returns {Matrix4x4}
     */
    times(matrix) {
        return Matrix4x4.multiply(this, matrix);
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
     * elements of `this` and `matrix`.
     * @param {Matrix4x4} matrix 
     * @returns {Matrix4x4}
     */
    plus(matrix) {
        return Matrix4x4.add(this, matrix);
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
     * elements of `this` and `matrix`.
     * @param {Matrix4x4} matrix 
     * @returns {Matrix4x4}
     */
    minus(matrix) {
        return Matrix4x4.subtract(this, matrix);
    }

    /**
     * Multiplies the `matrix` with `vector`, transforming the vector by the matrix.
     * If `out` is supplied, modifies it to store the result.
     * @param {Matrix4x4} matrix
     * @param {iVector3} vector
     * @param {Vector3} [out] - [OPTIONAL] modified if provided
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
     * Multiplies the matrix with a vector `vec`, transforming the vector by the matrix.
     * @param {iVector3} vector
     * @returns {Vector3}
     */
    timesVector3(vector) {
        const out = Vector3.zero();
        Matrix4x4.multiplyVector3(this, vector, out);
        return out;
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
            0, cos(radians), -sin(radians), 0,
            0, sin(radians), cos(radians), 0,
            0, 0, 0, 1);
        return out;
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
            cos(radians), 0, sin(radians), 0,
            0, 1, 0, 0,
            -sin(radians), 0, cos(radians), 0,
            0, 0, 0, 1);
        return out;
    }

    /**
     * Returns a rotation matrix that rotates around the z
     * axis by `radians`. If `out` is provided, overwrites it
     * rather than creating a new matrix.
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static fromZRotation(radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        out.setValues(
            cos(radians), -sin(radians), 0, 0,
            sin(radians), cos(radians), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
        return out;
    }

    /**
     * Returns the matrix resulting from rotating 
     * `mat` by `radians` around the x axis.
     * If `out` is provided, overwrites it
     * rather than creating a new matrix.
     * @param {Matrix4x4} mat - matrix to rotate
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static rotatedByX(mat, radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        const rotMat = Matrix4x4.fromXRotation(radians, Matrix4x4.__temp);
        return Matrix4x4.multiply(mat, rotMat, out);
    }

    /**
     * Returns the matrix resulting from rotating 
     * `mat` by `radians` around the y axis.
     * If `out` is provided, overwrites it
     * rather than creating a new matrix.
     * @param {Matrix4x4} mat - matrix to rotate
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static rotatedByY(mat, radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        const rotMat = Matrix4x4.fromYRotation(radians, Matrix4x4.__temp);
        return Matrix4x4.multiply(mat, rotMat, out);
    }

    /**
     * Returns the matrix resulting from rotating 
     * `mat` by `radians` around the z axis.
     * If `out` is provided, overwrites it
     * rather than creating a new matrix.
     * @param {Matrix4x4} mat - matrix to rotate
     * @param {number} radians - Angle to rotate by
     * @param {Matrix4x4} [out] - [OPTIONAL] modified if provided
     * @returns {Matrix4x4}
     */
    static rotatedByZ(mat, radians, out) {
        if (out === undefined) {
            out = Matrix4x4.identity();
        }
        const rotMat = Matrix4x4.fromZRotation(radians, Matrix4x4.__temp);
        return Matrix4x4.multiply(mat, rotMat, out);
    }

    /**
     * Returns a new matrix formed by rotating `this` around the x axis by `radians`.
     * @param {number} radians - Angle to rotate by
     * @returns {Matrix4x4}
     */
    rotX(radians) {
        return Matrix4x4.rotatedByX(this, radians);
    }

    /**
     * Returns a new matrix formed by rotating `this` around the y axis by `radians`.
     * @param {number} radians - Angle to rotate by
     * @returns {Matrix4x4}
     */
    rotY(radians) {
        return Matrix4x4.rotatedByY(this, radians);
    }

    /**
     * Returns a new matrix formed by rotating `this` around the z axis by `radians`.
     * @param {number} radians - Angle to rotate by
     * @returns {Matrix4x4}
     */
    rotZ(radians) {
        return Matrix4x4.rotatedByZ(this, radians);
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
/**
 * @private
 * DO NOT USE.
 * Internal temporary matrix used to reduce
 * allocations when doing matrix math.
 */
// @ts-ignore
Matrix4x4.__temp2 = Matrix4x4.identity();

/**
 * A 3d bounding box with a `lo` and `hi` property.
 * `lo` is the smallest x,y,z point and `hi` is the biggest x,y,z point
 */
class Bounds3D {
    lo = Vector3.create(Infinity, Infinity, Infinity)
    hi = Vector3.create(-Infinity, -Infinity, -Infinity)

    /**
     * Returns a bounding box that encompasses the
     * given points. If `out` is provided, modifies it
     * instead of creating new `Bounds3D`.
     * @param {iVector3[]} points
     * @param {Bounds3D} [out]
     * @returns {Bounds3D}
     */
    static fromPoints(points, out) {
        if (out === undefined) {
            out = new Bounds3D();
        }
        const lo = out.lo;
        const hi = out.hi;
        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            // Only allow the point to modify the extents if it is
            // not alreay encompassed in the bounds
            lo[0] = Math.min(lo[0], pt[0]);
            lo[1] = Math.min(lo[1], pt[1]);
            lo[2] = Math.min(lo[2], pt[2]);

            hi[0] = Math.max(hi[0], pt[0]);
            hi[1] = Math.max(hi[1], pt[1]);
            hi[2] = Math.max(hi[2], pt[2]);
        }
        return out;
    }

    /**
     * Returns a bounding box that encompasses the
     * the passed bounding boxes. If `out` is provided, modifies it
     * instead of creating new `Bounds3D`.
     * @param {Bounds3D} a
     * @param {Bounds3D} b
     * @param {Bounds3D} [out]
     * @returns {Bounds3D}
     */
    static fromUnion(a, b, out) {
        if (out === undefined) {
            out = new Bounds3D();
        }
        const lo = out.lo;
        const hi = out.hi;
        lo[0] = Math.min(a.lo[0], b.lo[0]);
        lo[1] = Math.min(a.lo[1], b.lo[1]);
        lo[2] = Math.min(a.lo[2], b.lo[2]);

        hi[0] = Math.max(a.hi[0], b.hi[0]);
        hi[1] = Math.max(a.hi[1], b.hi[1]);
        hi[2] = Math.max(a.hi[2], b.hi[2]);

        return out;
    }

    /**
     * Returns a bounding box that encompasses `this` and
     * the passed bounding boxe. If `out` is provided, modifies it
     * instead of creating new `Bounds3D`.
     * @param {Bounds3D} bounds
     * @param {Bounds3D} [out]
     * @returns {Bounds3D}
     */
    union(bounds, out) {
        return Bounds3D.fromUnion(this, bounds, out);
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
        initialSpaceMax = 1,
        squareAspect = true) {
        this.ctx = ctx;
        this.screenX = screenX;
        this.screenY = screenY;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.initialSpaceMin = initialSpaceMin;
        this.initialSpaceMax = initialSpaceMax;
        this.squareAspect = squareAspect;

        // Initial values. Will be overwritten later.
        this.scale = Vector3.create(1, 1, 1);
        this.translation = Vector3.zero();
        this.rotationMatrix = Matrix4x4.identity();
        this.matrix = Matrix4x4.identity();
        this.inverseMatrix = Matrix4x4.identity();

        /** @private */
        this.__tempP1 = Vector3.zero();
        /** @private */
        this.__tempP2 = Vector3.zero();
        /** @private */
        this.__tempP3 = Vector3.zero();
        /** @private */
        this.__tempP4 = Vector3.zero();

        this.updateViewMatrix();

        if (!Space.removeListeners) {
            const canvas = ctx.canvas;
            /**
             * @param {MouseEvent} mouseEvent 
             */
            const _onMouseMove = (mouseEvent) => {
                Space.__mouseButtons = mouseEvent.buttons;
                Space.rawMousePosition[0] = mouseEvent.clientX * canvas.width / canvas.clientWidth;
                Space.rawMousePosition[1] = mouseEvent.clientY * canvas.height / canvas.clientHeight;
                Space.rawMousePosition[2] = 0;
            }

            /**
             * @param {MouseEvent} mouseEvent 
             */
            const _onMouseClick = (mouseEvent) => {
                Space.__mouseButtons = mouseEvent.buttons;
                Space.__mouseButtonsClickedThisFrame =
                    Space.__mouseButtonsClickedThisFrame | (1 << mouseEvent.button);
            }

            /**
             * @param {MouseEvent} mouseEvent 
             */
            const _onMouseDown = (mouseEvent) => {
                Space.__mouseButtons = mouseEvent.buttons;
            }

            /**
             * @param {MouseEvent} mouseEvent 
             */
            const _onMouseUp = (mouseEvent) => {
                Space.__mouseButtons = mouseEvent.buttons;
            }

            window.addEventListener('mousemove', _onMouseMove);
            window.addEventListener('click', _onMouseClick);
            window.addEventListener('mousedown', _onMouseDown);
            window.addEventListener('mouseup', _onMouseUp);

            Space.removeListeners = () => {
                window.removeEventListener('mousemove', _onMouseMove);
                window.removeEventListener('click', _onMouseClick);
                window.removeEventListener('mousedown', _onMouseDown);
                window.removeEventListener('mouseup', _onMouseUp);
            }
        }
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
            screenX * canvas.width, 1 - screenY * canvas.height,
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
            screenX * canvas.width, 1 - screenY * canvas.height,
            (screenX + screenWidth) * canvas.width, (screenY + screenHeight) * canvas.height);
    }

    /**
     * Updates the view matrix and inverse matrix based on the current canvas dimensions and the current rotation.
     * *You probably won't need to use this directly.*
     * @returns {void}
     */
    updateViewMatrix() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        const left = canvas.width * this.screenX;
        const top = canvas.height * this.screenY;

        const minDim = Math.min(canvas.height * this.screenHeight, canvas.width * this.screenWidth);
        const xDim = this.squareAspect ? minDim : canvas.width * this.screenWidth;
        const yDim = this.squareAspect ? minDim : canvas.height * this.screenHeight;
        const zDim = minDim;
        const spaceDif = this.initialSpaceMax - this.initialSpaceMin;
        const spaceOffset = ilerp(this.initialSpaceMin, this.initialSpaceMax, 0);

        // Right handed coordinate system
        this.scale[0] = (xDim / spaceDif);
        this.scale[1] = -(yDim / spaceDif);
        this.scale[2] = -(zDim / spaceDif);
        this.translation[0] = canvas.width * this.screenWidth * spaceOffset + left;
        this.translation[1] = canvas.height - (canvas.height * this.screenHeight * spaceOffset + top);
        this.translation[2] = 0;
        this.matrix.setValues(
            this.scale[0], 0, 0, this.translation[0],
            0, this.scale[1], 0, this.translation[1],
            0, 0, this.scale[2], this.translation[2],
            0, 0, 0, 1);

        Matrix4x4.multiply(this.matrix, this.rotationMatrix, this.matrix);

        // Also store the inverse of the view matrix, which we can calculate directly.
        // See https://lxjk.github.io/2017/09/03/Fast-4x4-Matrix-Inverse-with-SSE-SIMD-Explained.html
        const iSx = 1 / this.scale[0];
        const iSy = 1 / this.scale[1];
        const iSz = 1 / this.scale[2];
        // 0 4 8  12
        // 1 5 9  13
        // 2 6 10 14
        // 3 7 11 15
        const rot = this.rotationMatrix;
        this.translation.duplicated(this.__tempP1);
        const iT = Vector3.scaled(this.__tempP1, -1, this.__tempP1);
        const X = this.__tempP2;
        const Y = this.__tempP3;
        const Z = this.__tempP4;
        X.setValues(iSx * rot[0], iSy * rot[1], iSz * rot[2]);
        Y.setValues(iSx * rot[4], iSy * rot[5], iSz * rot[6]);
        Z.setValues(iSx * rot[8], iSy * rot[9], iSz * rot[10]);
        this.inverseMatrix.setValues(
            X[0], X[1], X[2], iT.dot(X),
            Y[0], Y[1], Y[2], iT.dot(Y),
            Z[0], Z[1], Z[2], iT.dot(Z),
            0, 0, 0, 1,
        );
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
     * @param {iVector3} pt1 - coordinates of the first point
     * @param {iVector3} pt2 - coordinates of the first point
     *
     * @param {Object} [style] - [Optional] style properties e.g. `{color: 'red', thickness: 2}`
     * @param {string|number} [style.color] - Color of the line ('white' by default)
     * @param {number} [style.thickness] - Thickness of the line (1 by default)
     * 
     * @returns {void}
     */
    line(pt1, pt2, style = {}) {
        const color = style.color === undefined ? 'white' : style.color;
        const thickness = style.thickness === undefined ? 1 : style.thickness;

        if (color === null || !thickness) {
            return;
        }

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
     * @param {string|number} [style.color] - Color of the crosshair lines ('white' by default)
     * @param {number} [style.thickness] - Thickness of the crosshair lines (1 by default)
     * @returns {void}
     */
    crosshairs(centerPt, radius, style = {}) {
        const color = style.color === undefined ? 'white' : style.color;
        const thickness = style.thickness === undefined ? 1 : style.thickness;

        this.line([centerPt[0] - radius, centerPt[1], centerPt[2]],
            [centerPt[0] + radius, centerPt[1], centerPt[2]], { color, thickness });
        this.line([centerPt[0], centerPt[1] - radius, centerPt[2]],
            [centerPt[0], centerPt[1] + radius, centerPt[2]], { color, thickness });
        this.line([centerPt[0], centerPt[1], centerPt[2] - radius],
            [centerPt[0], centerPt[1], centerPt[2] + radius], { color, thickness });
    }

    /**
     * Draw 3d axes at the origin of the space.
     * 
     * @param {number} radius - Radius of the crosshairs.
     * @param {Object} [style] - [Optional] style properties e.g. `{ fill: 'red', stroke: 'green', thickness: 2 }`
     * @param {string|number} [style.fill] - Color of the axis labels ('white' by default)
     * @param {string|number} [style.stroke] - Color of the axis lines ('white' by default)
     * @param {number} [style.thickness] - Thickness of the axis lines (1 by default)
     * @returns {void}
     */
    axes(radius, textSize, style = {}) {
        const stroke = style.stroke === undefined ? 'white' : style.stroke;
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
     * @param {iVector3} cornerPt - Corner of the rectangle.
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle.
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the rectangle. `null` for no fill, which is the default.
     * @param {string|number|null} [style.stroke] - Stroke color of the rectangle. ('white' by default). `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the rectangle stroke (1 by default)
     * @returns {void}
     */
    rectXY(cornerPt, width, height, style = {}) {
        style.fill = style.fill === undefined ? null : style.fill;
        style.stroke = style.stroke === undefined ? 'white' : style.stroke;
        style.thickness = style.thickness === undefined ? 1 : style.thickness;

        this.polygon([
            cornerPt,
            [cornerPt[0], cornerPt[1] + height, cornerPt[2]],
            [cornerPt[0] + width, cornerPt[1] + height, cornerPt[2]],
            [cornerPt[0] + width, cornerPt[1], cornerPt[2]],
        ], style);
    }

    /**
     * Draw a rectangle in the yz plane.
     * 
     * @param {iVector3} cornerPt - Corner of the rectangle.
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle.
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the rectangle. `null` for no fill, which is the default.
     * @param {string|number|null} [style.stroke] - Stroke color of the rectangle. ('white' by default). `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the rectangle stroke (1 by default)
     * @returns {void}
     */
    rectYZ(cornerPt, width, height, style = {}) {
        style.fill = style.fill === undefined ? null : style.fill;
        style.stroke = style.stroke === undefined ? 'white' : style.stroke;
        style.thickness = style.thickness === undefined ? 1 : style.thickness;

        this.polygon([
            cornerPt,
            [cornerPt[0], cornerPt[1], cornerPt[2] + height],
            [cornerPt[0], cornerPt[1] + width, cornerPt[2] + height],
            [cornerPt[0], cornerPt[1] + width, cornerPt[2]],
        ], style);
    }

    /**
     * Draw a rectangle in the xz plane.
     * 
     * @param {iVector3} cornerPt - Corner of the rectangle.
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle.
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the rectangle. `null` for no fill, which is the default.
     * @param {string|number|null} [style.stroke] - Stroke color of the rectangle. ('white' by default). `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the rectangle stroke (1 by default)
     * @returns {void}
     */
    rectXZ(cornerPt, width, height, style = {}) {
        style.fill = style.fill === undefined ? null : style.fill;
        style.stroke = style.stroke === undefined ? 'white' : style.stroke;
        style.thickness = style.thickness === undefined ? 1 : style.thickness;

        this.polygon([
            cornerPt,
            [cornerPt[0], cornerPt[1], cornerPt[2] + height],
            [cornerPt[0] + width, cornerPt[1], cornerPt[2] + height],
            [cornerPt[0] + width, cornerPt[1], cornerPt[2]],
        ], style);
    }

    /**
     * Draw a polygon via the given points.
     * 
     * @param {iVector3[]} points - Points of the polygon
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.fill] - Fill color of the polygon. `null` for no fill, which is the default.
     * @param {string|number|null} [style.stroke] - Stroke color of the polygon. ('white' by default). `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the polygon stroke (1 by default)
     * @returns {void}
     */
    polygon(points, style = {}) {
        const fill = style.fill === undefined ? null : style.fill;
        const stroke = style.stroke === undefined ? 'white' : style.stroke;
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
     * Draw a polyline between the given points.
     * 
     * @param {iVector3[]} points - Points of the polyline
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red', stroke: 'green', thickness: 2}`
     * @param {string|number|null} [style.stroke] - Stroke color of the polyline. ('white' by default). `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the polyline stroke (1 by default)
     * @returns {void}
     */
    polyline(points, style = {}) {
        const stroke = style.stroke === undefined ? 'white' : style.stroke;
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
     * @param {string|number|null} [style.fill] - Fill color of the sphere. `null` for no fill, which is the default.
     * @param {string|number|null} [style.stroke] - Stroke color of the sphere. 'white' by default. `null` for no stroke.
     * @param {number} [style.thickness] - Thickness of the sphere's stroke
     * @returns {void}
     */
    sphere(centerPt, radius, style = {}) {
        const fill = style.fill === undefined ? null : style.fill;
        const stroke = style.stroke === undefined ? 'white' : style.stroke;
        const thickness = style.thickness === undefined ? 1 : style.thickness;

        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = Matrix4x4.multiplyVector3(mat, centerPt, /* out */this.__tempP1);
        const scaleX = Math.abs(this.scale[0]);
        const scaleY = Math.abs(this.scale[1]);
        ctx.beginPath();
        ctx.ellipse(pt[0], pt[1], radius * scaleX, radius * scaleY, 0, 0, TAU);
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
     * @param {Object} [style] - [Optional] style properties e.g. `{fill: 'red'}`
     * @param {string|number} [style.fill] - Fill color of the text. 'white' by default.
     * @returns {void}
     */
    text(text, size, position, style = {}) {
        const fill = style.fill === undefined ? 'white' : style.fill;

        if (fill === null) {
            return;
        }

        const mat = this.matrix;
        const ctx = this.ctx;
        const pt = Matrix4x4.multiplyVector3(mat, position, /* out */this.__tempP1);

        const scaleX = Math.abs(this.scale[0]);
        const spaceSize = this.initialSpaceMax - this.initialSpaceMin;
        ctx.font = `${(size * scaleX * 0.003 * spaceSize)}px sans-serif`;
        ctx.fillStyle = this._canvasColor(fill);
        // ctx.fillText(text, pt[0], pt[1]);
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
        const spaceSize = this.initialSpaceMax - this.initialSpaceMin;
        ctx.font = `${(size * scaleX * 0.003 * spaceSize)}px sans-serif`;
        const measurements = ctx.measureText(text);

        // const textWidth = measurements.width / scaleX;
        const textWidth =
            (measurements.actualBoundingBoxRight + measurements.actualBoundingBoxLeft)
            / scaleX;
        // WARNING: these are relative to the baseline,
        // so they're not as useful as would be ideal
        const textHeight =
            (measurements.actualBoundingBoxAscent + measurements.actualBoundingBoxDescent)
            / scaleY;
        return [textWidth, textHeight];
    }

    /**
     * Draw leds as spheres at the given positions using the values as the colors.
     * 
     * @param {iVector3[]} positions - Positions of each LED
     * @param {Uint8ClampedArray} values - Each 3 values correspond to the R,G,B values of one LED. `values.length` must equal `3*positions.length`.
     * @param {number} [radii] - Radius of each LED
     * @returns {void}
     */
    drawLeds(positions, values, radii = 0.01) {
        for (let i = 0; i < positions.length; i++) {
            const color = 0xFF | values[i * 3 + 2] << 8 | values[i * 3 + 1] << 16 | values[i * 3 + 0] << 24;
            this.sphere(positions[i], radii, { fill: color, stroke: null });
        }
    }

    /**
     * Set the rotation of the space to the given rotation matrix.
     * @param {Matrix4x4} rotationMatrix
     */
    setSpaceRotationMatrix(rotationMatrix) {
        Matrix4x4.copy(rotationMatrix, this.rotationMatrix);
        this.updateViewMatrix();
    }

    /**
     * Reset the rotation of the space so there is no rotation.
     */
    resetSpaceRotation() {
        this.rotationMatrix.setToIdentity();
        this.updateViewMatrix();
    }

    /**
     * Set the rotation of the space to the given rotations on each axis.
     * @param {number} xRadians - Rotation around x axis
     * @param {number} yRadians - Rotation around y axis
     * @param {number} zRadians - Rotation around z axis
     */
    setSpaceRotation(xRadians, yRadians, zRadians) {
        // Matrix4x4.fromZRotation(xRadians, this.rotationMatrix);
        // Matrix4x4.rotatedByY(this.rotationMatrix, yRadians, this.rotationMatrix);
        // Matrix4x4.rotatedByX(this.rotationMatrix, zRadians, this.rotationMatrix);
        const a = xRadians, b = yRadians, c = zRadians;
        this.rotationMatrix.setValues(
            cos(a) * cos(b), cos(a) * sin(b) * sin(c) - sin(a) * cos(c), cos(a) * sin(b) * cos(c) + sin(a) * sin(c), 0,
            sin(a) * cos(b), sin(a) * sin(b) * sin(c) + cos(a) * cos(c), sin(a) * sin(b) * cos(c) - cos(a) * sin(c), 0,
            -sin(b), cos(b) * sin(c), cos(b) * cos(c), 0,
            0, 0, 0, 1,
        )
        this.updateViewMatrix();
    }

    /**
     * Rotate the space by the given angle around the x axis
     * @param {number} radians - Rotation around the axis
     */
    rotateSpaceByX(radians) {
        Matrix4x4.rotatedByX(this.rotationMatrix, radians, this.rotationMatrix);
        this.updateViewMatrix();
    }

    /**
     * Rotate the space by the given angle around the y axis
     * @param {number} radians - Rotation around the axis
     */
    rotateSpaceByY(radians) {
        Matrix4x4.rotatedByY(this.rotationMatrix, radians, this.rotationMatrix);
        this.updateViewMatrix();
    }

    /**
     * Rotate the space by the given angle around the z axis
     * @param {number} radians - Rotation around the axis
     */
    rotateSpaceByZ(radians) {
        Matrix4x4.rotatedByZ(this.rotationMatrix, radians, this.rotationMatrix);
        this.updateViewMatrix();
    }

    /**
     * Returns the mouse position relative to this space.
     * The mouse position will be unclamped so it won't be limited
     * to the edges of the space.
     * 
     * If you do want the mouse to be clamped, use `getMousePosition` instead.
     * 
     * Use the optional `depth` parameter to choose the
     * z-plane of the mouse prior to translating it into the
     * space's coordinate system.
     * Overwrites and returns `out` if provided; otherwise
     * returns a new vector as the result.
     * @param {number} [depth] - [OPTIONAL] - z-plane to use for the mouse pre-transformation
     * @param {Vector3} [out] - [OPTIONAL] - modified if provided
     * @returns {Vector3} - mouse position transformed into this space
     */
    getMousePositionUnclamped(depth = 0, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        Space.rawMousePosition.duplicated(out);
        out[2] = depth;
        return Matrix4x4.multiplyVector3(this.inverseMatrix, out, out);
    }

    /**
     * Returns the top left point of the space in the space's coordinate system.
     * Use the optional `depth` parameter to choose the
     * z-plane of the point prior to translating it into the
     * space's coordinate system.
     * Overwrites and returns `out` if provided; otherwise
     * returns a new vector as the result.
     * @param {number} [depth] 
     * @param {Vector3} [out] 
     * @returns 
     */
    getTopLeftPoint(depth = 0, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const canvas = this.ctx.canvas;
        out[0] = this.screenX * canvas.width;
        out[1] = (1 - (this.screenY + this.screenHeight)) * canvas.height;
        out[2] = depth;
        return Matrix4x4.multiplyVector3(this.inverseMatrix, out, out);
    }

    /**
     * Returns the top right point of the space in the space's coordinate system.
     * Use the optional `depth` parameter to choose the
     * z-plane of the point prior to translating it into the
     * space's coordinate system.
     * Overwrites and returns `out` if provided; otherwise
     * returns a new vector as the result.
     * @param {number} [depth] 
     * @param {Vector3} [out] 
     * @returns 
     */
    getTopRightPoint(depth = 0, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const canvas = this.ctx.canvas;
        out[0] = (this.screenX + this.screenWidth) * canvas.width;
        out[1] = (1 - (this.screenY + this.screenHeight)) * canvas.height;
        out[2] = depth;
        return Matrix4x4.multiplyVector3(this.inverseMatrix, out, out);
    }

    /**
     * Returns the bottom right point of the space in the space's coordinate system.
     * Use the optional `depth` parameter to choose the
     * z-plane of the point prior to translating it into the
     * space's coordinate system.
     * Overwrites and returns `out` if provided; otherwise
     * returns a new vector as the result.
     * @param {number} [depth] 
     * @param {Vector3} [out] 
     * @returns 
     */
    getBottomRightPoint(depth = 0, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const canvas = this.ctx.canvas;
        out[0] = (this.screenX + this.screenWidth) * canvas.width;
        out[1] = (1 - this.screenY) * canvas.height;
        out[2] = depth;
        return Matrix4x4.multiplyVector3(this.inverseMatrix, out, out);
    }

    /**
     * Returns the bottom left point of the space in the space's coordinate system.
     * Use the optional `depth` parameter to choose the
     * z-plane of the point prior to translating it into the
     * space's coordinate system.
     * Overwrites and returns `out` if provided; otherwise
     * returns a new vector as the result.
     * @param {number} [depth] 
     * @param {Vector3} [out] 
     * @returns 
     */
    getBottomLeftPoint(depth = 0, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const canvas = this.ctx.canvas;
        out[0] = this.screenX * canvas.width;
        out[1] = (1 - this.screenY) * canvas.height;
        out[2] = depth;
        return Matrix4x4.multiplyVector3(this.inverseMatrix, out, out);
    }

    /**
     * Returns the mouse position relative to this space.
     * The result will be clamped such that the mouse position
     * may not move outside the bounds of the space.
     * 
     * Use `getMousePositionUnclamped` instead if you want to get
     * the mouse position in a space without any clamping.
     * 
     * Use the optional `depth` parameter to choose the
     * z-plane of the mouse prior to translating it into the
     * space's coordinate system.
     * Overwrites and returns `out` if provided; otherwise
     * returns a new vector as the result.
     * @param {number} [depth] - [OPTIONAL] - z-plane to use for the mouse pre-transformation
     * @param {Vector3} [out] - [OPTIONAL] - modified if provided
     * @returns {Vector3} - mouse position transformed into this space
     */
    getMousePosition(depth = 0, out) {
        if (out === undefined) {
            out = Vector3.zero();
        }
        const rawPos = Space.rawMousePosition;
        const canvas = this.ctx.canvas;
        out[0] = clamp(this.screenX * canvas.width, (this.screenX + this.screenWidth) * canvas.width, rawPos[0]);
        out[1] = canvas.height - clamp(
            this.screenY * canvas.height,
            (this.screenY + this.screenHeight) * canvas.height,
            canvas.height - rawPos[1]);
        out[2] = depth;
        return Matrix4x4.multiplyVector3(this.inverseMatrix, out, out);
    }

    /**
     * Returns `true` if the mouse is within the current space. Otherwise,
     * returns `false`.
     * @returns {boolean}
     */
    isMouseWithinSpace() {
        const rawPos = Space.rawMousePosition;
        const canvas = this.ctx.canvas;
        return rawPos[0] >= this.screenX * canvas.width
            && rawPos[0] <= (this.screenX + this.screenWidth) * canvas.width
            && canvas.height - rawPos[1] >= this.screenY * canvas.height
            && canvas.height - rawPos[1] <= (this.screenY + this.screenHeight) * canvas.height;
    }

    /**
     * Returns `true` if the given mouse button is held down.
     * If `buttonIndex` is not provided, defaults to checking the Primary (left) mouse button.
     * @param {0|1|2|3|4} buttonIndex Index of the button:
     * - 0 = Primary (Left) Button
     * - 1 = Secondary (Right) Button
     * - 2 = Auxillary (Middle) Button
     * - 3 = 4th Button (usually "Browser Back")
     * - 4 = 5th Button (usually "Browser Forward")
     * @returns {boolean}
     */
    isMouseButtonHeld(buttonIndex = 0) {
        return (Space.__mouseButtons & (1 << buttonIndex)) > 0;
    }

    /**
     * Returns `true` if the given mouse button was clicked some time this frame.
     * If `buttonIndex` is not provided, defaults to checking the Primary (left) mouse button.
     * @param {0|1|2|3|4} buttonIndex Index of the button:
     * - 0 = Primary (Left) Button
     * - 1 = Secondary (Right) Button
     * - 2 = Auxillary (Middle) Button
     * - 3 = 4th Button (usually "Browser Back")
     * - 4 = 5th Button (usually "Browser Forward")
     * @returns {boolean}
     */
    wasMouseButtonClicked(buttonIndex = 0) {
        return (Space.__mouseButtonsClickedThisFrame & (1 << buttonIndex)) > 0;
    }
}
/**
 * @type {null | (() => void)}
 */
Space.removeListeners = null;
/**
 * Raw position of the mouse in canvas coordinates,
 * where <0, 0, 0> is in the top left and <canvas.width, canvas.height, 0>
 * is at the bottom right.
 */
Space.rawMousePosition = Vector3.zero();
/**
 * @private
 * Bitfield indicating which buttons are currently held.
 */
// @ts-ignore
Space.__mouseButtons = 0;
/**
 * @private
 * Bitfield indicating which buttons were clicked this frame.
 */
// @ts-ignore
Space.__mouseButtonsClickedThisFrame = 0;
/**
 * Must be called once at the end of every frame.
 */
Space.onFrameEnd = () => {
    // @ts-ignore
    Space.__mouseButtonsClickedThisFrame = 0;
};
/**
 * Auto-resize the canvas to have the same number of pixels as the actual screen.
 * @param {CanvasRenderingContext2D} ctx
 */
Space.autoResize = (ctx) => {
    const canvas = ctx.canvas;
    const desWidth = canvas.clientWidth * devicePixelRatio;
    const desHeight = canvas.clientHeight * devicePixelRatio;
    if (desWidth !== canvas.width || desHeight !== canvas.height) {
        canvas.width = desWidth;
        canvas.height = desHeight;
    }
}

class UserInterface {
    COLOR_IDLE = 'black'
    COLOR_HOVERED = 'green'
    COLOR_ACTIVE = 'yellow'
    COLOR_TEXT_IDLE = 'white'
    COLOR_TEXT_HOVERED = 'black'
    UI_TEXT_SIZE = 10

    /**
     * @private 
     * @type {Vector3} */
    __tempV3 = Vector3.zero();

    /**
     * @param {Space} space
     */
    constructor(space) {
        this.space = space;
    }

    /**
     * @returns {number} The top of this UI space (y coordinate)
     */
    top() {
        return this.space.getTopLeftPoint(0, this.__tempV3)[1];
    }

    /**
     * @returns {number} The bottom of this UI space (y coordinate)
     */
    bottom() {
        return this.space.getBottomLeftPoint(0, this.__tempV3)[1];
    }

    /**
     * @returns {number} The left side of this UI space (x coordinate)
     */
    left() {
        return this.space.getTopLeftPoint(0, this.__tempV3)[0];
    }

    /**
     * @returns {number} The right side of this UI space (x coordinate)
     */
    right() {
        return this.space.getBottomLeftPoint(0, this.__tempV3)[0];
    }

    /**
     * Is the mouse hovering over the given rectangle?
     * @param {number} x Left coordinate of the rect
     * @param {number} y Bottom coordinate of the rect
     * @param {number} width Width of the rect
     * @param {number} height Height of the rect
     * @returns {boolean} True if the mouse is over the rectangle.
     */
    isHoveringRect(x, y, width, height) {
        const pos = this.space.getMousePosition(0, this.__tempV3);
        return this.isPointInRect(pos, x, y, width, height);
    }

    /**
     * Is the point inside the given rectangle?
     * @param {number} x Left coordinate of the rect
     * @param {number} y Bottom coordinate of the rect
     * @param {number} width Width of the rect
     * @param {number} height Height of the rect
     * @returns {boolean} True if the point is in the rectangle.
     */
    isPointInRect(point, x, y, width, height) {
        return point[0] > x && point[0] < x + width
            && point[1] > y && point[1] < y + height;
    }

    /**
     * Is the mouse hovering over the given circle?
     * @param {number} x Center x coordinate of the circle
     * @param {number} y Center y coordinate of the circle
     * @param {number} radius Radius of the circle
     * @returns {boolean} True if the mouse is over the circle.
     */
    isHoveringCircle(x, y, radius) {
        const pos = this.space.getMousePosition(0, this.__tempV3);
        return (x - pos[0]) * (x - pos[0]) + (y - pos[1]) * (y - pos[1]) < radius * radius;
    }

    /**
     * Is the point inside the given circle?
     * @param {number} x Center x coordinate of the circle
     * @param {number} y Center y coordinate of the circle
     * @param {number} radius Radius of the circle
     * @returns {boolean} True if the point is in the circle.
     */
    isPointInCircle(point, x, y, radius) {
        return (x - point[0]) * (x - point[0]) + (y - point[1]) * (y - point[1]) < radius * radius;
    }

    /** 
     * Draws an interactive button.
     * @param {string} label Text to display on the button
     * @param {number} x Left coordinate of the button in UI space
     * @param {number} y Bottom coordinate of the button in UI space
     * @returns {boolean} True if the button was clicked this frame
     */
    button(label, x, y) {
        const fontSize = this.UI_TEXT_SIZE;
        const space = this.space;

        const labelDims = space.measureText(label, fontSize);
        const padding = labelDims[1] * 0.3;
        const width = labelDims[0] + padding * 2;
        const height = labelDims[1] + padding * 2;

        const isHovered = this.isHoveringRect(x, y, width, height);
        const wentDown = isHovered && space.wasMouseButtonClicked(0);

        this.rect(x, y, width, height,
            { fill: isHovered ? this.COLOR_HOVERED : this.COLOR_IDLE });
        space.text(label, fontSize, [x + padding, y + padding, 0], {
            fill: isHovered ? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE
        });

        return wentDown;
    }

    /** 
     * Draws an interactive circular button.
     * @param {string} label Text to display on the button
     * @param {number} x Center x coordinate of the button in UI space
     * @param {number} y Center y coordinate of the button in UI space
     * @returns {boolean} True if the button was clicked this frame
     */
    circleButton(label, x, y) {
        const fontSize = this.UI_TEXT_SIZE;
        const space = this.space;

        const labelDims = space.measureText(label, fontSize);
        const padding = labelDims[1] * 0.4;
        const width = labelDims[0];
        const height = labelDims[1];
        const radius = width * 0.5 + padding;

        const isHovered = this.isHoveringCircle(x, y, radius);
        const wentDown = isHovered && space.wasMouseButtonClicked(0);

        space.sphere([x, y, 0], radius, { fill: isHovered ? this.COLOR_HOVERED : this.COLOR_IDLE })
        space.text(label, fontSize, [x - width * 0.5, y - height * 0.5, 0], {
            fill: isHovered ? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE
        });

        return wentDown;
    }

    /** 
     * Draws an interactive button that has an active/inactive state.
     * @param {string} label Text to display on the button
     * @param {boolean} isActive Should the button appear "active" even if not hovered?
     * @param {number} x Left coordinate of the button in UI space
     * @param {number} y Bottom coordinate of the button in UI space
     * @returns {boolean} True if the button was clicked this frame
     */
    highlightButton(label, isActive, x, y) {
        const fontSize = this.UI_TEXT_SIZE;
        const space = this.space;

        const labelDims = space.measureText(label, fontSize);
        const padding = labelDims[1] * 0.3;
        const width = labelDims[0] + padding * 2;
        const height = labelDims[1] + padding * 2;

        const isHovered = this.isHoveringRect(x, y, width, height);
        const wentDown = isHovered && space.wasMouseButtonClicked(0);

        let fill;
        if (isHovered) {
            fill = this.COLOR_HOVERED;
        } else if (isActive) {
            fill = this.COLOR_ACTIVE;
        } else {
            fill = this.COLOR_IDLE;
        }
        this.rect(x, y, width, height, { fill });
        space.text(label, fontSize, [x + padding, y + padding, 0],
            { fill: isHovered || isActive ? this.COLOR_TEXT_HOVERED : this.COLOR_TEXT_IDLE });

        return wentDown;
    }

    rect(x, y, width, height, style) {
        const space = this.space;
        this.__tempV3.setValues(x, y, 0)
        space.rectXY(this.__tempV3, width, height, style);
    }

    /** 
     * Draws a text label.
     * @param {string} text Text to display on the button
     * @param {number} x Left coordinate of the label in UI space
     * @param {number} y Bottom coordinate of the label in UI space
     * @param {Object} [style] - [Optional] style properties e.g. `{ fill: 'red' }`
     * @param {string|number|null} [style.fill] - Fill color of the text.
     * @returns {void}
     */
    label(text, x, y, style = {}) {
        style.fill = style.fill === undefined ? this.COLOR_TEXT_IDLE : style.fill;
        const fontSize = this.UI_TEXT_SIZE;
        const space = this.space;
        space.text(text, fontSize, [x, y, 0], style);
    }

    /**
     * Draws an interactive slider that has a `lo`, `hi`, and `curr` value.
     * Returns the slider's new value, or `curr` if it didn't change.
     * The value will always be clamped to be between `lo` and `hi`.
     * @param {string} name - Name of the slider
     * @param {number} x - Left coordinate of the slider
     * @param {number} y - Bottom coordinate of the slider
     * @param {number} lo - Minimum value of the slider
     * @param {number} hi - Maximum value of the slider
     * @param {number} curr - Current value of the slider
     * @returns {number} New value of the slider.
     */
    slider(name, x, y, lo, hi, curr) {
        const fontSize = this.UI_TEXT_SIZE;
        const space = this.space;
        const labelDims = space.measureText(name, fontSize);
        space.text(name, fontSize, [x, y, 0], { fill: this.COLOR_TEXT_IDLE });
        const width = 25;
        const height = 3;

        const sliderX = x + 2 + labelDims[0];

        const mouse = space.getMousePositionUnclamped(0, this.__tempV3);
        let newValue = curr;
        let fill = this.COLOR_ACTIVE;
        if (this.isPointInRect(mouse, sliderX, y, width, height)) {
            if (space.isMouseButtonHeld(0)) {
                newValue = linMap(sliderX, sliderX + width, lo, hi, mouse[0]);
            }
            fill = this.COLOR_HOVERED;
        }
        this.rect(x + 2 + labelDims[0], y, width, height, { fill: this.COLOR_IDLE });
        this.rect(x + 2 + labelDims[0], y, ilerp(lo, hi, curr) * width, height, { fill });
        return clamp(lo, hi, newValue);
    }

    /**
     * Draws an interactive checkbox.
     * Clicking on the checkbox returns the opposite value of `state`.
     * Otherwise, returns `state`.
     * @param {string} name - Name of the Checkbox
     * @param {number} x - Left coordinate of the Checkbox
     * @param {number} y - Bottom coordinate of the Checkbox
     * @param {boolean} state - Current state of the Ceckbox
     * @returns {boolean} - The new state of the checkbox.
     */
    checkbox(name, x, y, state) {
        const fontSize = this.UI_TEXT_SIZE;
        const space = this.space;
        const labelDims = space.measureText(name, fontSize);
        space.text(name, fontSize, [x, y, 0], { fill: this.COLOR_TEXT_IDLE });
        const height = 3;
        let fill = state ? this.COLOR_ACTIVE : this.COLOR_IDLE;
        let newState = state;
        const checkboxX = x + 2 + labelDims[0];
        if (this.isHoveringRect(checkboxX, y, height, height)) {
            fill = this.COLOR_HOVERED;
            if (space.wasMouseButtonClicked(0)) {
                newState = !state;
            }
        }
        this.rect(checkboxX, y, height, height, { fill });
        return newState;
    }

    /** 
     * Must be called exactly once at the end of the frame.
     * @returns {void}
     */
    onFrameEnd() {
        this.space.updateViewMatrix();
    }
}

/**
 * A class that represents a view on the screen with a specific location
 * and a user interface.
 * 
 * The space has coordinates you specify in the constructor.
 * 
 * You can access the user interface with `.ui`.
 * Its dimensions range from 0-100. 0,0 is at the bottom.
 */
class View extends Space {
    /**
     * Create a new view for drawing on the screen.
     * The view will appear with a corner at `screenX, screenY`
     * and dimensions `screenWidth` and `screenHeight`.
     * These coordinates exist in a space where 0,0 is the bottom left of the canvas
     * and 1,1 is the top right of the canvas.
     * 
     * Each view has a user interface that you can access via `.ui`.
     * 
     * @param {CanvasRenderingContext2D} ctx - rendering canvas
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} screenWidth
     * @param {number} screenHeight
     * @param {number} initialSpaceMin - initial minimum value at the edge of the space
     * @param {number} initialSpaceMax - initial maximum value at the edge of the space
     */
    constructor(ctx,
        screenX,
        screenY,
        screenWidth,
        screenHeight,
        initialSpaceMin = -1,
        initialSpaceMax = 1) {
        super(ctx, screenX,
            screenY,
            screenWidth,
            screenHeight,
            initialSpaceMin,
            initialSpaceMax);
        const uiSpace = new Space(ctx,
            screenX,
            screenY,
            screenWidth,
            screenHeight,
            0,
            100);
        this.ui = new UserInterface(uiSpace);
    }

    onFrameEnd() {
        this.updateViewMatrix();
        this.ui.onFrameEnd();
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Given some data points, returns a new `Vector3` array
 * containing corresponding points uniformly scaled down based on the 
 * given bounding box. If the bounding box encompasses all
 * the points, we guarantee that the resulting points will all
 * fit in the unit cube ranging from [-1,-1,-1] to [1,1,1].
 * 
 * @param {iVector3[]} dataPoints
 * @param {Bounds3D} [boundingBox] - [OPTIONAL] 
 * @returns {Vector3[]}
 */
function mapPointsToNormalizedCoords(dataPoints, boundingBox) {
    if (boundingBox === undefined) {
        boundingBox = Bounds3D.fromPoints(dataPoints);
    }

    let maxBoundValue = -Infinity;
    for (let i = 0; i < boundingBox.lo.length; i++) {
        maxBoundValue = Math.max(maxBoundValue, Math.abs(boundingBox.lo[i]));
        maxBoundValue = Math.max(maxBoundValue, Math.abs(boundingBox.hi[i]));
    }
    const scaleFactor = 1 / maxBoundValue;

    const normalizedPoints = [];
    for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        const scaledPt = Vector3.create(pt[0] * scaleFactor, pt[1] * scaleFactor, pt[2] * scaleFactor);
        normalizedPoints.push(scaledPt);
    }
    return normalizedPoints;
}

/**
 * Given some data points that are of the form [x,y,z], 
 * returns a new array of Vector3s with corresponding values.
 * @param {iVector3[]} dataPoints
 * @returns {Vector3[]}
 */
function mapPointsToVector3s(dataPoints) {
    return dataPoints.map((v) => Vector3.create(v[0], v[1], v[2]));
}

/**
 * Interpolates between the given list of points.
 * If t is 1, returns the last point
 * If t is 0, returns the first point
 * Otherwise, returns a blended value in between.
 * If the t value indicates a location between two points,
 * linearly interpolate between them.
 * @param {iVector3[]} points - points to interpolate between
 * @param {number} t - a number between 0 and 1
 * @param {Vector3} [out] - [OPTIONAL] modified with the result if provided
 * @returns {Vector3}
 */
function interpBetweenPoints(points, t, out) {
    const rawIdx = lerp(0, points.length - 1, clamp01(t));
    const startIdx = Math.floor(rawIdx);
    const endIdx = Math.ceil(rawIdx);
    return Vector3.lerp(points[startIdx], points[endIdx], ilerp(startIdx, endIdx, rawIdx), out);
}

class Spaces {
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    constructor(ctx) {
        this.Front = new View(ctx, 0, .5, 0.5, 0.5, -1, 1);
        this.Perspective = new View(ctx, 0.5, 0.5, 0.5, 0.5, -1, 1);
        this.Top = new View(ctx, 0, 0, 0.5, 0.5, -1, 1);
        this.GUI = new View(ctx, 0.5, 0, 0.5, 0.5, -1, 1);
        this.Frames = new Space(ctx, 0, 0, 1, 1, 0, 1, /* squareAspect */ false);
    }

    onFrameEnd() {
        for (const spaceKey in this) {
            const prop = this[spaceKey];
            if (prop instanceof View) {
                prop.onFrameEnd();
            }
        }
    }
}

/**
 * Primary state of the visualizer.
 * Stores the colors of the LEDs and any values
 * needed to calculate the next animation frame.
 *
 * @template SavedValues
 */
class State {
    /** Data that encodes the color of each LED. Every 3 entries in the array correspond to the R,G,B values of one LED. */
    ledData = new Uint8ClampedArray(0);
    /**
     * @type {SavedValues}
     */
    // @ts-ignore
    saved = {};
    /**
     * @type {SavedValues}
     */
    // @ts-ignore
    savedDefaults = {};

    /**
     * This is a union of all the different possible states we might be in at any given point in time.
     * @typedef {DeviceState_Scanning|DeviceState_UnableToConnect|DeviceState_Connected} DeviceState
     */
    /**
     * One of the possible types of `DeviceState`.
     * @typedef {object} DeviceState_Scanning
     * @property {'Scanning'} status
     * @property {PortInfo[]} found - an array of the devices found so far
     */
    /**
     * One of the possible types of `DeviceState`.
     * @typedef {object} DeviceState_UnableToConnect
     * @property {'UnableToConnect'} status
     * @property {Error} err - the reason we were unable to connect
     */
    /**
    * One of the possible types of `DeviceState`.
    * @typedef {object} DeviceState_Connected
    * @property {'Connected'} status
    * @property {PortInfo} details - details for the device to which we are connected
    */

    /**
     * Information about a device. Can be used to auto-connect to it even when plugged in to a different port or computer.
     * @typedef {object} PortInfo
     * @property {string} path - Path or identifier used to open the device. Typically something like tty/* on Mac/Linux and COM* on windows
     * @property {string} [vendorId] - Example: `'2341'`. Identifier for the group that made the device. Somewhat consistent between platforms.
     * @property {string} [productId] - Example: `'0043'`. Identifier for the specific product model. Somewhat consistent between platforms.
     * @property {string} [serialNumber] - Example: `'752303138333518011C1'`. Device Serial# only present for USB devices. Somewhat consistent between platforms.
     * @property {string} [manufacturer] - Example: `'Arduino (www.arduino.cc)'`. Who made the device. Often reported differently by different drivers.
     * @property {string} [locationId] - Example: `'14500000'` or `undefined` or `'Port_#0003.Hub_#0001'`. Where the device is plugged in. Not guaranteed to be the same or present on all systems.
     * @property {string} [pnpId] - Example: `'USB\\VID_2341&PID_0043\\752303138333518011C1'`. Plug and Play ID. Windows only?
     */

    /** @type {DeviceState} */
    deviceState = { status: 'Scanning', found: [] };

    /**
     * Creates a new `State` object. 
     * Pass in an object literal for `savedDefaults` to
     * make those values be the default values for properties that will
     * be saved every time the server reports that a file has changed
     * and the browser reloads.
     * @param {SavedValues} savedDefaults
     */
    constructor(savedDefaults) {
        this.savedDefaults = JSON.parse(JSON.stringify(savedDefaults));
        this.reset();
        this.tryRestoreFromSave();

        this.statusWs = new WebSocket(`ws://${window.location.host}/status`);
        this.statusWs.onopen = (evt) => {
            console.log('[Status] Opened websocket for getting device status messages.');
        };
        this.statusWs.onmessage = (evt) => {
            try {
                this.deviceState = JSON.parse(evt.data);
                console.log('[Status]', this.deviceState);
            } catch (e) {
                console.error('Unable to parse status message', e);
            }
        };

        this.dataWs = new WebSocket(`ws://${window.location.host}/data`);
        this.dataWs.onopen = (evt) => {
            console.log('[Data] Opened websocket for forwarding messages to microcontroller.');
        };
        this.dataWs.onclose = (evt) => {
            console.warn(`
            [Data] Closed websocket. Will no longer send actuator data to server.
            
            You likely stopped the server or opened a new browser tab (only one can send data at a time).
            If you didn't expect this, make sure the server is running and refresh the page.
            `);
        };

        window['INSTALLATION_STATE'] = this;

        window.addEventListener('beforeunload', () => {
            // Browser is about to reload.
            // Quickly save any state that should persist between reloads.
            this.savePreReload();
        });
    }

    /**
     * Reset the state of all values that persist between reloads
     */
    reset() {
        this.saved = JSON.parse(JSON.stringify(this.savedDefaults));
    }

    /**
     * Save any data that should persist between reloads.
     */
    savePreReload() {
        localStorage.setItem(State.STORAGE_KEY, JSON.stringify(this.saved));
    }

    /**
     * Restore any data we persisted.
     */
    tryRestoreFromSave() {
        const storedStr = localStorage.getItem(State.STORAGE_KEY);
        if (storedStr) {
            try {
                const stored = JSON.parse(storedStr);
                this.saved = { ...this.saved, ...stored };
            } catch (error) {
                localStorage.removeItem(State.STORAGE_KEY);
            }
        }
    }

    /**
     * Send the passed data to the server, which will pass it
     * on to the microcontroller if there is a connected microcontroller.
     * 
     * @param {Uint8ClampedArray} data
     */
    trySendToMicrocontroller(data) {
        if (this.dataWs.readyState === WebSocket.OPEN) {
            this.dataWs.send(data);
        }
    }
}
State.STORAGE_KEY = 'InstallationState';


/**
 * Start the main animation loop
 * @param {number} msPerFrame 
 * @param {State} state 
 */
function beginMainLoop(msPerFrame, state) {
    const mappings = new Mappings(state);
    /** @type {HTMLCanvasElement} */
    const canvas = (/** @type {HTMLCanvasElement} */document.getElementById('visualization'));
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext('2d');
    Space.autoResize(ctx);
    const spaces = new Spaces(ctx);
    let lastMsTs = performance.now();

    /**
     * Main animation loop
     * @param {number} elapsedMs Number of milliseconds that elapsed since the beginning.
     * @param {number} dtMs Number of milliseconds that elapsed since the last call.
     */
    function _loop(elapsedMs, dtMs) {
        Space.autoResize(ctx);
        const Frames = spaces.Frames;
        const Perspective = spaces.Perspective;
        const Front = spaces.Front;
        const Top = spaces.Top;
        Frames.resetSpaceRotation();
        Frames.background(0x333333FF);
        Frames.rectXY([0, 0, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });
        Frames.rectXY([0.5, 0, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });
        Frames.rectXY([0.5, 0.5, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });
        Frames.rectXY([0, 0.5, 0], 0.5, 0.5, { stroke: 0xFF, thickness: 2 });

        Perspective.axes(1, 6, { stroke: 0xFFFFFF, thickness: 0.5 });

        Front.setSpaceRotation(0, 0, -TAU / 4);
        Front.axes(1, 6, { stroke: 0xFFFFFF, thickness: 0.5 });

        Top.setSpaceRotation(0, 0, 0);
        Top.axes(1, 6, { stroke: 0xFFFFFF, thickness: 0.5 });
        loop(elapsedMs, dtMs, spaces, mappings);
        spaces.onFrameEnd();
        Space.onFrameEnd();

        const newMsTs = performance.now();
        lastMsTs = elapsedMs;
        const dt = newMsTs - lastMsTs;
        setTimeout(_loop, msPerFrame, newMsTs, dt);
        // requestAnimationFrame(_loop);

    }
    setTimeout(_loop, msPerFrame, msPerFrame, msPerFrame);
    // requestAnimationFrame(_loop);
}

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
/** @typedef {'Get started below!'} Playground */
// 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇

/**
 * Mappings that express the relationship between data points in different coordinate systems.
 * The length of each stored array should correspond to the total number of LEDs.
 */
class Mappings {
    /** @param {State} state */
    constructor(state) {
        /** @type {Vector3[]} array of data points in physical coordinates */
        this.physical = [];
        /** @type {Vector3[]} corresponding array of data points in normalized coordinates */
        this.normalized = [];
        /** @type {Vector3[]} flat array of data points in normalized coordinates */
        this.normalizedFlat = [];

        this.normalizedCurve = [];

        Promise.all(
            [
                this.readMapping('mappingPersp.json'),
                this.readMapping('mappingFlat.json'),
                this.readMapping('mappingCurve.json'),
            ]
        ).then(([persp, flat, curve]) => {
            this.physical = mapPointsToVector3s(persp);
            const perspBounds = Bounds3D.fromPoints(persp);
            const curveBounds = Bounds3D.fromPoints(curve);
            const flatBounds = Bounds3D.fromPoints(flat);
            const fullBounds = perspBounds.union(curveBounds).union(flatBounds);

            this.normalized = mapPointsToNormalizedCoords(persp, fullBounds);
            this.normalizedCurve = mapPointsToNormalizedCoords(curve, fullBounds);
            this.normalizedFlat = mapPointsToNormalizedCoords(flat, fullBounds);

            state.ledData = new Uint8ClampedArray(persp.length * 3); // 3 bytes per LED, for Red, Green, Blue channels of each LED
        });
    }

    /**
     * Parses the given json file from the 'server/front/mappings' directory and returns the JSON data.
     * @param {string} jsonFileName 
     * @returns {Promise<Object>}
     */
    readMapping(jsonFileName) {
        return fetch(`http://${window.location.host}/mappings/${jsonFileName}`).then((value) => value.json());
    }
}

/** @typedef {'Section for changing default values:'} StateDefinition */
const $state = new State(
    /**
     * Any values you set on the properties of this object
     * will become "default" values for ```$state.saved```.
     * You can freely change them inside the `loop` function
     * and whatever changes you make will be saved to your browser
     * even if you reload the page, unless you click the `reset` button,
     * in which case the values will be reset to the default values specified below:
     */
    {
        animState: 0,
        sliderState: 0,
        rotation: {
            x: false,
            xVal: 0,
            y: false,
            yVal: 0,
            z: false,
            zVal: 0,
        },
        anim: {
            show: false,

        }
    }
);
beginMainLoop(/* msPerFrame */1000 / 60, $state);

/**
 * Animation loop function. Called approximately at the update rate.
 * @param {number} elapsedMs Number of milliseconds elapsed since beginning of the program
 * @param {number} dtMs Number of milliseconds elapsed since last frame
 * @param {Spaces} spaces 
 * @param {Mappings} mappings 
 */
function loop(elapsedMs, dtMs, spaces, mappings) {
    const { Front, Perspective, Top, GUI } = spaces;
    /** 
     * Data that encodes the color of each LED. Every 3 entries in the array correspond to the R,G,B values of one LED.
     * 
     * ```
     * Index:    0 1 2   3 4 5   6 7 8  ...
     * Channel:  R,G,B,  R,G,B,  R,G,B  ...
     * LED:        0       1       2    ...
     * ```
     * 
     * - `$ledData[0]` corresponds to the Red channel of LED 0
     * - `$ledData[1]` corresponds to the Green channel of LED 0
     * - `$ledData[2]` corresponds to the Blue channel of LED 0
     * - `$ledData[3]` corresponds to the Red channel of the LED 1
     * - etc...
     * 
     * 
     * - To change the Red channel of the `n`th LED, use 
     * ```
     * $ledData[n*3 + 0]
     * ```
     * - To change the Green channel of the `n`th LED, use 
     * ```
     * $ledData[n*3 + 1]
     * ```
     * - To change the Blue channel of the `n`th LED, use 
     * ```
     * $ledData[n*3 + 2]
     * ```
     */
    const $ledData = $state.ledData;
    $ledData.fill(0); // Set the color of all channels to 0
    /**
     * Any modifications you make to the properties of `$saved` will stick around
     * unless you click the reset button or call `$state.reset();`.
     * @see {StateDefinition} to add or remove properties from `$saved`.
     */
    const $saved = $state.saved;


    { // Main UI
        const uiX = 5;
        let uiY = GUI.ui.top();
        // GUI.ui.label(`Default Values: ${JSON.stringify($state.savedDefaults)}`, 5, uiY -= 5);
        // GUI.ui.label(`Saved Values: ${JSON.stringify($saved)}`, 5, uiY -= 5);
        if (GUI.ui.button('Reset State', 5, uiY -= 5)) {
            $state.reset();
        }

        if ($saved.rotation.x = GUI.ui.checkbox('Rotate X?', uiX, uiY -= 5, $saved.rotation.x)) {
            $saved.rotation.xVal = GUI.ui.slider(`Rx`, uiX, uiY -= 5, -1, 1, $saved.rotation.xVal);
            Perspective.rotateSpaceByX($saved.rotation.xVal * dtMs * 0.002);
        }
        if ($saved.rotation.y = GUI.ui.checkbox('Rotate Y?', uiX, uiY -= 5, $saved.rotation.y)) {
            $saved.rotation.yVal = GUI.ui.slider(`Ry`, uiX, uiY -= 5, -1, 1, $saved.rotation.yVal);
            Perspective.rotateSpaceByY($saved.rotation.yVal * dtMs * 0.002);
        }
        if ($saved.rotation.z = GUI.ui.checkbox('Rotate Z?', uiX, uiY -= 5, $saved.rotation.z)) {
            $saved.rotation.zVal = GUI.ui.slider(`Rz`, uiX, uiY -= 5, -1, 1, $saved.rotation.zVal);
            Perspective.rotateSpaceByZ($saved.rotation.zVal * dtMs * 0.002);
        }
    }

    { // Animation UI
        let uiY = GUI.ui.top();
        let uiX = 50;
        if ($saved.anim.show = GUI.ui.checkbox('Anim', uiX, uiY -= 15, $saved.anim.show)) {
            uiX += 5;
            if (GUI.ui.highlightButton('Anim1', $saved.animState === 0, uiX, uiY -= 5)) {
                $saved.animState = 0;
            }
            if (GUI.ui.highlightButton('Anim2', $saved.animState === 1, uiX, uiY -= 5)) {
                $saved.animState = 1;
            }
            if (GUI.ui.highlightButton('Anim3', $saved.animState === 2, uiX, uiY -= 5)) {
                $saved.animState = 2;
            }
        }
    }

    { // Status UI
        let uiY = GUI.ui.bottom() + 2;
        GUI.ui.label(`Device Status: ${$state.deviceState.status}`, 2, uiY);
        GUI.ui.label(`Connected to Server: ${$state.statusWs.readyState === WebSocket.OPEN}`, 2, uiY += 5);
    }

    { // Draw some perspective helper UI
        let xxx = [1, 0, 0];
        let yyy = [0, 1, 0];
        let zzz = [0, 0, 1];
        Perspective.line([0, 0, 0], xxx, { color: 'red', thickness: 2 });
        Perspective.line([0, 0, 0], yyy, { color: 'green', thickness: 2 });
        Perspective.line([0, 0, 0], zzz, { color: 'blue', thickness: 2 });

        Perspective.rectXY([-0.5, -0.5, 0], 1, 1, { stroke: 0xFFFF001F, thickness: 2 });
        Perspective.rectYZ([0, -0.5, -0.5], 1, 1, { stroke: 0xFFFF001F, thickness: 2 });
        Perspective.rectXZ([-0.5, 0, -0.5], 1, 1, { stroke: 0xFFFF001F, thickness: 2 });
    }


    if ($saved.anim.show) {
        //Anim1: Vertical line passing across the screen 
        if ($saved.animState == 0) {
            exampleAnim1(elapsedMs, dtMs, spaces, mappings);
        }

        //Anim2: Polar line rotating
        if ($saved.animState == 1) {
            exampleAnim2(elapsedMs, dtMs, spaces, mappings);
        }

        //Anim3: Circle expanding 
        if ($saved.animState == 2) {
            exampleAnim3(elapsedMs, dtMs, spaces, mappings);
        }
    }

    // Perspective.sphere(Perspective.getMousePosition(), 0.01, { fill: Perspective.isMouseWithinSpace() ? 'green' : 'white', stroke: null });
    // Top.sphere(Top.getMousePosition(), 0.01, { fill: Top.isMouseWithinSpace() ? 'green' : 'white', stroke: null });
    // Front.sphere(Front.getMousePosition(), 0.01, { fill: Front.isMouseWithinSpace() ? 'green' : 'white', stroke: null });
    // GUI.sphere(GUI.getMousePosition(), 0.01, { fill: GUI.isMouseWithinSpace() ? 'green' : 'white', stroke: null });



    // Some other buttons for drawing objects
    // if ($saved.cir.show = GUI.ui.checkbox('Circle', 5, uiY -= 5, $saved.cir.show)) {
    //     $saved.cir.radius = GUI.ui.slider(`Rad`, 5, uiY -= 5, 0, 1, $saved.cir.radius);
    //     Perspective.sphere([0, 0, 0], $saved.cir.radius);
    // }
    // GUI.ui.circleButton('My Circle Bttn', 50, 60);


    // GUI.ui.space.sphere(GUI.ui.mousePosition, 5, { fill: 'red' });

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
    //     //     $ledData[i * 3 + 0] = 255;
    //     // } else {
    //     //     $ledData[i * 3 + 0] = 0;
    //     // }

    //     if (state.animState == 0) {
    //         line(lineXNorm, bottom, lineXNorm, top);
    //         let distToVerticalLine = Math.abs(pt[0] - lineXNorm);
    //         if (distToVerticalLine < 0.3) {
    //             //red
    //             $ledData[i * 3 + 0] = 255;
    //         } else {
    //             $ledData[i * 3 + 0] = 0;
    //         }
    //     }

    //     if (state.animState == 1) {
    //         strokeWeight(4 * pixelsToNorm);
    //         stroke('#ffffffff');
    //         noFill();
    //         let dia = (Math.sin(elapsedMs * 0.001) + 1) * 0.5;
    //         ellipse(0, 0, dia, dia);
    //         if (length(pt[0], pt[1]) < dia) {
    //             $ledData[i * 3 + 0] = 255;
    //         } else {
    //             $ledData[i * 3 + 0] = 0;
    //         }
    //     }


    //     if (state.animState == 2) {
    //         strokeWeight(4 * pixelsToNorm);
    //         stroke('#ffffffff');
    //         noFill();
    //         line(0, 0, Math.sin(elapsedMs * 0.001), Math.cos(elapsedMs * 0.001));
    //         let dist = shortestDistance(pt[0], pt[1], 0, 0, (Math.sin(elapsedMs * 0.001) - 0) / 2, (Math.cos(elapsedMs * 0.001) - 0) / 2);
    //         if (dist < 0.4) {
    //             $ledData[i * 3 + 0] = 255;
    //         } else {
    //             $ledData[i * 3 + 0] = 0;
    //         }
    //     }


    //     //green and blue
    //     $ledData[i * 3 + 1] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
    //     $ledData[i * 3 + 2] = 0;//((Math.sin(elapsedMs * 0.001) + 1) * 0.5 * 255) | 0;
    // }

    // noStroke();
    // for (let i = 0; i < normMapping.length; i++) {
    //     const pt = normMapping[i];

    //     // Calculate the color of the current pixel:
    //     const color = 0xFF | $ledData[i * 3 + 2] << 8 | $ledData[i * 3 + 1] << 16 | $ledData[i * 3 + 0] << 24;
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


    { // Actually display LEDs in different views (and label the views)
        Front.ui.label(`Front [normalized:${mappings.normalized.length}]`, 5, 5, { fill: 'white' });
        Front.drawLeds(mappings.normalized, $ledData);

        Perspective.ui.label(`Perspective [normalized:${mappings.normalized.length}]`, 5, 5, { fill: 'white' });
        Perspective.drawLeds(mappings.normalized, $ledData);

        Top.ui.label(`Top [normalizedFlat:${mappings.normalizedFlat.length}]`, 5, 5, { fill: 'white' });
        Top.drawLeds(mappings.normalizedFlat, $ledData);
    }

    /**
     * Try to actually send the state of all the LEDs to the server,
     * which will pass them along to a connected microcontroller.
     */
    $state.trySendToMicrocontroller($ledData);
}

/**
 * Example animation loop function. Called approximately at the update rate.
 * @param {number} elapsedMs Number of milliseconds elapsed since beginning of the program
 * @param {number} dtMs Number of milliseconds elapsed since last frame
 * @param {Spaces} spaces 
 * @param {Mappings} mappings 
 */
function exampleAnim1(elapsedMs, dtMs, { Front, Perspective, Top, GUI }, mappings) {
    const $ledData = $state.ledData;
    const points = mappings.normalized;
    const x = sin(elapsedMs * 0.0007);

    Front.line([x, 0, 1], [x, 0, -1], { color: 'yellow', thickness: 6 });
    Perspective.line([x, 0, 1], [x, 0, -1], { color: 'yellow', thickness: 6 });
    Top.line([x, 0, 1], [x, 0, -1], { color: 'yellow', thickness: 6 });
    for (let i = 0; i < points.length; i++) {
        let pt = points[i];
        let di = abs(x - pt[0]);
        const threshold = 0.5;
        if (di < threshold) {
            $ledData[i * 3 + 0] = 255 * clamp01(ilerp(threshold, 0, di));
        } else {
            $ledData[i * 3 + 0] = 0;
        }
    }
}

/**
 * Example animation loop function. Called approximately at the update rate.
 * @param {number} elapsedMs Number of milliseconds elapsed since beginning of the program
 * @param {number} dtMs Number of milliseconds elapsed since last frame
 * @param {Spaces} spaces 
 * @param {Mappings} mappings 
 */
function exampleAnim2(elapsedMs, dtMs, { Front, Perspective, Top, GUI }, mappings) {
    const $ledData = $state.ledData;
    const points = mappings.normalized;

    const sphere2Loc = [0, 0, 0];
    let rot = [cos(elapsedMs * 0.001) + sphere2Loc[0], sin(elapsedMs * 0.001) + sphere2Loc[1], 0 + sphere2Loc[2]];
    Perspective.line(sphere2Loc, rot, { color: 'blue' });
    Front.line(sphere2Loc, rot, { color: 'blue' });
    Top.line(sphere2Loc, rot, { color: 'blue' });

    for (let i = 0; i < points.length; i++) {
        let pt = points[i];
        let di2 = pt.distTo(rot);
        const threshold = 0.6;
        if (di2 < threshold) {
            $ledData[i * 3 + 0] += 255 * clamp01(ilerp(threshold, 0, di2));
            $ledData[i * 3 + 1] += 0;
            $ledData[i * 3 + 2] += 255 * clamp01(ilerp(threshold, 0, di2));
        }
    }
}

/**
 * Example animation loop function. Called approximately at the update rate.
 * @param {number} elapsedMs Number of milliseconds elapsed since beginning of the program
 * @param {number} dtMs Number of milliseconds elapsed since last frame
 * @param {Spaces} spaces 
 * @param {Mappings} mappings 
 */
function exampleAnim3(elapsedMs, dtMs, { Front, Perspective, Top, GUI }, mappings) {
    const $ledData = $state.ledData;
    const points = mappings.normalized;
    const curvePoints = mappings.normalizedCurve;

    Perspective.polyline(curvePoints, { stroke: 'green' });
    Front.polyline(curvePoints, { stroke: 'green' });
    const rad1 = linMap(-1, 1, 0.1, 0.6, sin(elapsedMs * 0.0007)) * 0.9;
    const rad2 = linMap(-1, 1, 0.7, 0.2, sin(elapsedMs * 0.0009)) * 0.8;
    const evalCurve = linMap(-1, 1, 0, 1, sin(elapsedMs * 0.0009)) * 0.8;

    const sphere1Loc = interpBetweenPoints(curvePoints, evalCurve);
    const sphere2Loc = [0.8, 0.8, 0];

    Front.sphere(sphere1Loc, rad1, { stroke: 'red' });
    Perspective.sphere(sphere1Loc, rad1, { stroke: 'red' });
    Top.sphere(sphere1Loc, rad1, { stroke: 'red' });

    Front.sphere(sphere2Loc, rad2, { stroke: 'blue' });
    Perspective.sphere(sphere2Loc, rad2, { stroke: 'blue' });
    Top.sphere(sphere2Loc, rad2, { stroke: 'blue' });

    for (let i = 0; i < points.length; i++) {
        let pt = points[i];
        let di1 = pt.distTo(sphere1Loc);
        let di2 = pt.distTo(sphere2Loc);
        if (di1 < rad1) {
            $ledData[i * 3 + 0] += 252;
            $ledData[i * 3 + 1] += 186;
            $ledData[i * 3 + 2] += 3;
        }
        if (di2 < rad2) {
            $ledData[i * 3 + 0] += 3;
            $ledData[i * 3 + 1] += 240;
            $ledData[i * 3 + 2] += 252;
        }
    }
}
