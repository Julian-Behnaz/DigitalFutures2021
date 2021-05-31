const fs = require('fs'),
    http = require('http');
const WebSocket = require('ws');
const SerialPort = require('serialport');

const SERVER_PORT = 8080;

const kDEVICE_STATE = {
    Scanning: 'Scanning',
    NoDevicesFound: 'NoDevicesFound',
    UnableToConnect: 'UnableToConnect',
    Connected: 'Connected',
};

/** @type {?SerialPort} */
let currDevice = null;
let deviceState = {
    status: kDEVICE_STATE.Scanning,
};
let prevDeviceStatus = null;
let websockets = {
    data: null,
    status: null,
    update: null,
};

function logDeviceState() {
    if (prevDeviceStatus !== deviceState.status) {
        console.log('deviceState:');
        console.log(deviceState);
        prevDeviceStatus = deviceState.status;

        if (websockets.status) {
            websockets.status.send(JSON.stringify(deviceState));
        }
    }
}

function setDeviceStateScanning() {
    deviceState = {
        status: kDEVICE_STATE.Scanning,
    };
    logDeviceState();
}

function setDeviceStateUnableToConnect(err) {
    deviceState = {
        status: kDEVICE_STATE.UnableToConnect,
        err
    };
    logDeviceState();
}

function setDeviceStateConnected(path, vendorId, productId, serialNumber) {
    deviceState = {
        status: kDEVICE_STATE.Connected,
        details: {
            path,
            vendorId,
            productId,
            serialNumber
        }
    };
    logDeviceState();
}


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scanForDevices() {
    setDeviceStateScanning();
    while (true) {
        if (deviceState.status === kDEVICE_STATE.Scanning) {
            const data = await SerialPort.list();
            let info = null;
            for (let i = 0; i < data.length; i++) {
                if (data[i].vendorId === '16C0') {
                    // Found a device with an Arduino vendor ID
                    info = data[i];
                    break;
                }
            }
            if (info) {
                currDevice = new SerialPort(info.path, { baudRate: 115200 }, (err) => {
                    if (err) {
                        // Something went wrong when opening the port!
                        setDeviceStateUnableToConnect(err);
                        setDeviceStateScanning();
                    } else {
                        // Device opened sucessfully
                        setDeviceStateConnected(info.path, info.vendorId, info.productId, info.serialNumber);
                    }
                });
                currDevice.on('close', () => {
                    console.log('DEVICE CLOSED');
                    setDeviceStateScanning();
                });
                currDevice.on('error', (err) => {
                    console.log('DEVICE ERROR', err);
                    setDeviceStateScanning();
                });
            } else {
                setDeviceStateScanning();
            }
        }
        await sleep(1000);
    }
}

// let fsWait = false;
// fs.watch(buttonPressesLogFile, (event, filename) => {
//   if (filename) {
//     if (fsWait) return;
//     fsWait = setTimeout(() => {
//       fsWait = false;
//     }, 100);
//     console.log(`${filename} file Changed`);
//   }
// });

const server = http.createServer(function (req, res) {
    const uri = new URL(req.url, `http://localhost:${SERVER_PORT}/`);
    const pathname = uri.pathname === '/' ? '/index.html' : uri.pathname;
    console.log('GOT REQUEST TO', pathname);
    fs.readFile(`${__dirname}/front${pathname}`, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        const headers = {};
        if (pathname.endsWith('.js')) {
            headers['Content-Type'] = 'text/javascript';
        } else if (pathname.endsWith('.js')) {
            headers['Content-Type'] = 'application/json';
        }
        res.writeHead(200, headers);
        res.end(data);
    });
});

const dataServer = new WebSocket.Server({ noServer: true });
dataServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        if (deviceState.status === kDEVICE_STATE.Connected) {
            // currDevice.write([0xFF, 0xFE, 0xFD,
            //     0xFF, 0x00, 0x00, // R
            //     0x00, 0xFF, 0x00, // B
            //     0x00, 0x00, 0xFF, // G
            //     0xFF, 0xFF, 0xFF, //
            //     0xFF, 0xFF, 0xFF, //
            // ]);
            currDevice.write([0xFF, 0xFE, 0xFD]);
            currDevice.write(message);
            // console.log(message);
        }
    });

    ws.on('close', (ws) => {

    });

    if (websockets.data) {
        websockets.data.close();
    }
    websockets.data = ws;

    ws.send(JSON.stringify(deviceState));
});

const statusServer = new WebSocket.Server({ noServer: true });
statusServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.on('close', (ws) => {

    });

    if (websockets.status) {
        websockets.status.close();
    }
    websockets.status = ws;

    ws.send(JSON.stringify(deviceState));
});

const updateServer = new WebSocket.Server({ noServer: true });
updateServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.on('close', (ws) => {

    });

    if (websockets.update) {
        websockets.update.close();
    }
    websockets.update = ws;

    ws.send(JSON.stringify(deviceState));
});

server.on('upgrade', function upgrade(request, socket, head) {
    const uri = new URL(request.url, `http://localhost:${SERVER_PORT}/`);
    const pathname = uri.pathname;

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

scanForDevices();
server.listen(SERVER_PORT);