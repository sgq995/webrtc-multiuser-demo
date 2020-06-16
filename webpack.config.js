const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
        after: function(app, server, compiler) {
            const wss = new WebSocket.Server({
                port: 3000
            });

            wss.on('connection', (socket) => {
                socket.on('message', (message) => {
                    console.log('received %s', message);
                    socket.send(message);
                });
            });
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
