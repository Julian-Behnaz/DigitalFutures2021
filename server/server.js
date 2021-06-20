// @ts-check
'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIG
////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇

/**
 * The baud rate to use when connecting to the microcontroller
 * The units are bits/second.
 * This needs to match the baud rate in the microcontroller code
 * so that this server can talk to the microcontroller.
 */
const DEVICE_BAUD_RATE = 1000000;
/**
 * Returns `true` if the passed `portInfo` matches the device you want to
 * autoconnect to. You'll probably need to change this depending
 * on the microcontroller you're using, but once you've done that,
 * your code will work even if you plug your microcontroller into
 * a different port on your computer or run it on a different computer.
 * @param {PortInfo} portInfo 
 * @returns {boolean}
 */
function isDesiredPortInfo(portInfo) {
    return (portInfo.vendorId === '2341' /* Arduino */
        || (portInfo.vendorId === '16C0' || portInfo.vendorId === '16c0' /* Teensy */));
}

/**
 * Given a specific `device` and `buffer`, sends the buffer to the device,
 * along with any other bytes the device might need for things like synchronization.
 * @param {SerialPort} device 
 * @param {Buffer} buffer 
 */
function forwardBufferToDevice(device, buffer) {
    // Byte sequence the microcontroller expects to begin every message.
    // Used to reduce chance of desynchronization.
    // device.write(buffer);

    // We use 0xFF to indicate the start of a frame
    device.write([0xFF]);
    for (let i = 0; i < buffer.length; i++) {
        // If we see 0xFF in the regular buffer, use 0xFE instead.
        // This will guarantee that 0xFF will only be used to indicate message starts
        buffer[i] = buffer[i] === 0xFF ? 0xFE : buffer[i];
    }
    device.write(buffer);
    device.drain();


    // Example message. Might be useful for debugging color channel ordering.
    // device.write([
    //     0xFF, 0xFE, 0xFD,
    //     0xFF, 0x00, 0x00, // R
    //     0x00, 0xFF, 0x00, // B
    //     0x00, 0x00, 0xFF, // G
    //     0xFF, 0xFF, 0xFF, // White
    //     0xFF, 0xFF, 0xFF, // White
    // ]);
    // console.log(buffer);
}

/**
 * The port where this webserver runs.
 * You'll be able to open http://localhost:BROWSER_PORT/
 * in a browser to open the webapp.
 */
const BROWSER_PORT = 8080;

// 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
const fs = require('fs'),
    http = require('http');
const WebSocket = require('ws');
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter')

// See https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
const ANSI_COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m"
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

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


/** 
 * If we are connected to a device, this will contain a reference
 * to the `SerialPort` we use to communicated with that device.
 * Otherwise it will contain `null`.
 * @type {?SerialPort}
 */
let connectedDevice = null;

/**
 * This tracks the current state we are in.
 * It will change as devices get plugged in/unplugged and
 * as we discover a device to which we want to connect.
 * @type {DeviceState}
 */
let currDeviceState = {
    status: 'Scanning',
    found: []
};
/**
 * This is the state we were in before the current state.
 * We use it to determine if our state has changed, so we
 * can send messages only if the state has changed. 
 * @type {?DeviceState}*/
let prevDeviceState = null;


/**
 * We maintain several connections to a single webapp at a time using websockets.
 * Each websocket has a diffrent purpose.
 */
const websockets = {
    /**
     * Allows the browser to send messages to the server that
     * the server will pass on to the microcontroller.
     * @type {?WebSocket} */
    data: null,
    /**
     * Reports the status of the server to the webapp, so that the
     * webapp will know what the server is doing (scanning, connected to a device, etc...).
     * @type {?WebSocket} */
    status: null,
    /** 
     * The server posts to this when a frontend file has been modified.
     * That allows the webapp to live reload when frontend code changes.
     * @type {?WebSocket}
     */
    update: null,
};

/**
 * Returns true if the two passed device states, `a` and `b`, are sufficiently
 * equivalent that we don't need to report that something changed.
 * @param {DeviceState} a 
 * @param {DeviceState} b 
 * @returns {boolean}
 */
function areStatesApproxEqual(a, b) {
    if (a && b && a.status === b.status) {
        switch (a.status) {
            case 'Connected':
                /** @type {DeviceState_Connected} */
                const bConnected = (/** @type {DeviceState_Connected} */ b);
                return a.details === bConnected.details;
            case 'Scanning':
                /** @type {DeviceState_Scanning} */
                const bScanning = (/** @type {DeviceState_Scanning} */ b);
                const aFound = a.found;
                const bFound = bScanning.found;
                if (a.found.length == bScanning.found.length) {
                    for (let i = 0; i < a.found.length; i++) {
                        for (let x in aFound[i]) {
                            if (bFound[i][x] !== aFound[i][x]) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
                break;
            case 'UnableToConnect':
                return true;
        }
    }
    return false;
}

/**
 * If the device state has changed since the lass call to this function,
 * logs information about the change to the console where the server is running
 * and also sends the current device state to the "status" websocket.
 * @returns {void}
 */
function reportDeviceStateIfChanged() {
    if (!areStatesApproxEqual(prevDeviceState, currDeviceState)) {
        console.log('🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌');
        console.log('deviceState:');
        console.log(currDeviceState);
        console.log('🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌🔌');
        prevDeviceState = currDeviceState;

        if (websockets.status) {
            websockets.status.send(JSON.stringify(currDeviceState));
        }
    }
}

/**
 * Sets `deviceState` to the Scanning state.
 * Stores info about what devices we've found thus far.
 * @param {PortInfo[]} foundSoFar
 */
function setDeviceStateScanning(foundSoFar) {
    currDeviceState = {
        status: 'Scanning',
        found: foundSoFar
    };
    reportDeviceStateIfChanged();
}

/**
 * Sets `deviceState` to the UnableToConnect state.
 * Stores the error that prevented connection.
 * @param {Error} err
 */
function setDeviceStateUnableToConnect(err) {
    currDeviceState = {
        status: 'UnableToConnect',
        err
    };
    reportDeviceStateIfChanged();
}

/**
 * Sets `deviceState` to the Connected state.
 * Stores simple serializable info a
 * @param {string} path 
 * @param {?string} vendorId 
 * @param {?string} productId 
 * @param {?string} serialNumber 
 */
function setDeviceStateConnected(path, vendorId, productId, serialNumber) {
    currDeviceState = {
        status: 'Connected',
        details: {
            path,
            vendorId,
            productId,
            serialNumber
        }
    };
    reportDeviceStateIfChanged();
}


/**
 * Sleep for the specified number of milliseconds.
 * @param {number} ms 
 * @returns {Promise<NodeJS.Timeout>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const NO_DEVICES = [];
/**
 * Continuously scan for devices while we are not connected to a device.
 * Sets `connectedDevice` and `currDeviceState` based on the scan result.
 * @param {number} intervalMs - scan interval in milliseconds
 */
async function scanForDevices(intervalMs) {
    setDeviceStateScanning(NO_DEVICES);
    while (true) {
        if (currDeviceState.status === 'Scanning') {
            const deviceList = await SerialPort.list();
            /** @type {?PortInfo} */
            let info = null;
            for (let i = 0; i < deviceList.length; i++) {
                if (isDesiredPortInfo(deviceList[i])) {
                    info = deviceList[i];
                    break;
                }
            }
            if (info) {
                connectedDevice = new SerialPort(info.path, { baudRate: DEVICE_BAUD_RATE }, (err) => {
                    if (err) {
                        // Something went wrong when opening the port!
                        setDeviceStateUnableToConnect(err);
                        setDeviceStateScanning(deviceList);
                    } else {
                        connectedDevice.flush();
                        const parser = connectedDevice.pipe(new Delimiter({ delimiter: '\n' }));
                        parser.setEncoding('utf8');
                        parser.on('data', (read) => {
                            logDevice('💬', read);
                        });

                        // Device opened sucessfully
                        setDeviceStateConnected(info.path, info.vendorId, info.productId, info.serialNumber);
                    }
                });
                connectedDevice.on('close', () => {
                    logDevice('CLOSED');
                    setDeviceStateScanning(NO_DEVICES);
                });
                connectedDevice.on('error', (err) => {
                    logDevice('ERROR', err);
                    setDeviceStateScanning(NO_DEVICES);
                });
            } else {
                setDeviceStateScanning(deviceList);
            }
        }
        await sleep(intervalMs);
    }
}

/** Set up a file server to serve HTML pages, javascript, and JSON files. */
const server = http.createServer(function (req, res) {
    const uri = new URL(req.url, `http://localhost:${BROWSER_PORT}/`);
    const pathname = uri.pathname === '/' ? '/index.html' : uri.pathname;
    logServer('got request', pathname);
    fs.readFile(`${__dirname}/front${pathname}`, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        /** @type {http.OutgoingHttpHeaders}  */
        const headers = {};
        if (pathname.endsWith('.js')) {
            headers['Content-Type'] = 'text/javascript';
        } else if (pathname.endsWith('.json')) {
            headers['Content-Type'] = 'application/json';
        }
        res.writeHead(200, headers);
        res.end(data);
    });
});

/** Websocket for forwarding data to connected microcontroller. */
const dataServer = new WebSocket.Server({ noServer: true });
dataServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        if (currDeviceState.status === 'Connected') {
            if (message instanceof Buffer) {
                forwardBufferToDevice(connectedDevice, message);
            } else {
                logServer('Error', 'Message from dataServer is not a Buffer!');
            }
        }
    });

    if (websockets.data) {
        websockets.data.close();
    }
    websockets.data = ws;
});

/** Websocket for telling the frontend what the connection status is. */
const statusServer = new WebSocket.Server({ noServer: true });
statusServer.on('connection', function connection(ws) {
    if (websockets.status) {
        websockets.status.close();
    }
    websockets.status = ws;

    ws.send(JSON.stringify(currDeviceState));
});

/** Websocket for telling the frontend to reload when files change. */
const updateServer = new WebSocket.Server({ noServer: true });
updateServer.on('connection', function connection(ws) {
    if (websockets.update) {
        websockets.update.close();
    }
    websockets.update = ws;
});

/** 
 * If we get a watch event, we set a brief timeout during which we
 * don't send update messages. Otherwise, we might trigger
 * many back-to-back reloads due to noisy watch events.
 * @type {NodeJS.Timeout|null}
 */
let fsWait = null;
fs.watch('./front', { recursive: true }, (event, filename) => {
    if (filename) {
        if (fsWait !== null) { return; }
        fsWait = setTimeout(() => {
            fsWait = null;
        }, 100);
        logServer('file changed', filename);
        if (websockets.update) {
            websockets.update.send(JSON.stringify({ changed: filename }));
        }
    }
});

server.on('upgrade', function upgrade(request, socket, head) {
    const uri = new URL(request.url, `http://localhost:${BROWSER_PORT}/`);
    const pathname = uri.pathname;

    /** Set up websockets on different routes for different purposes */
    if (pathname === '/data') {
        dataServer.handleUpgrade(request, socket, head, function done(ws) {
            dataServer.emit('connection', ws, request);
        });
    } else if (pathname === '/status') {
        statusServer.handleUpgrade(request, socket, head, function done(ws) {
            statusServer.emit('connection', ws, request);
        });
    } else if (pathname === '/update') {
        updateServer.handleUpgrade(request, socket, head, function done(ws) {
            updateServer.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

function log(sys, action, color, ...msg) {
    console.log(color, `[${sys} (${action})]`, ...msg, ANSI_COLORS.reset);
}

function logDevice(action, ...msg) {
    log('DEVICE', action, ANSI_COLORS.fg.cyan, ...msg);
}

function logServer(action, ...msg) {
    log('SERVER', action, ANSI_COLORS.dim, ...msg);
}


server.listen(BROWSER_PORT);
console.log(`
👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇

Open a browser to http://localhost:${BROWSER_PORT}/ to connect to the server ...

👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
`);
scanForDevices(1000);