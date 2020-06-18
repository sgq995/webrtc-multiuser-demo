const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const e = require('express');

const userList = new Map();

function generateId() {
    let id;
    do {
        id = crypto.randomBytes(16).toString("hex");
    } while (userList.has(id));

    return id;
}

function sendToClient(socket, object) {
    const data = JSON.stringify(object);
    console.log('[SERVER] ', data);
    socket.send(data);
}

function createOnMessage(id, socket) {
    const onMessage = (data) => {
        console.log('[CLIENT] ', id, data);
        const object = JSON.parse(data);
        const { type, target, description, candidate } = object;

        try {
            if (type === "join") {
                const peerList = Array.from(userList.keys()).filter(otherId => otherId !== id);
                sendToClient(socket, {
                    type: "list",
                    peerList
                });
                userList.set(id, socket);
            } else if (description !== undefined) {
                if (userList.has(target)) {
                    const peerSocket = userList.get(target);
                    sendToClient(peerSocket, {
                        source: id,
                        description
                    });
                }
            } else if (candidate !== undefined) {
                if (userList.has(target)) {
                    const peerSocket = userList.get(target);
                    sendToClient(peerSocket, {
                        source: id,
                        candidate
                    });
                }
            }
        } catch {

        }
    };

    return onMessage;
}

function createOnClose(id, socket) {
    const onClose = (code, reason) => {
        console.log('[CLOSE] ', id, code, reason);
        userList.delete(id);
    };

    return onClose;
}

function createOnError(id, socket) {
    const onError = (err) => {
        console.error('[ERROR] ', id, err);
        userList.delete(id);
        this.close();
    };

    return onError;
}

function createWebSocketServer() {
    const wss = new WebSocket.Server({
        port: 3000
    });

    wss.on('connection', (socket) => {
        const id = generateId();

        socket.on('message', createOnMessage(id, socket));
        socket.on('close', createOnClose(id, socket));
        socket.on('error', createOnError(id, socket));
    });
}

module.exports = {
    mode: 'development',
    entry: {
        app: './src/index.js'
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        hot: true,
        host: '0.0.0.0',
        https: true,
        // key: fs.readFileSync('./certs/server.key'),
        // cert: fs.readFileSync('./certs/server.cert'),
        proxy: {
            '/signaling': {
                target: 'ws://localhost:3000',
                ws: true,
            },
        },
        after: function (app, server, compiler) {
            createWebSocketServer();
        }
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
    ],
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
