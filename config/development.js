"use strict";
let webpack = require('webpack');
let path = require('path');

let APP_DIR = path.join(__dirname, '..', 'app');

module.exports = {
    debug: true,
    devtool: 'eval',
    entry: ['webpack-hot-middleware/client', './app/index.tsx'],
    module: {
        preLoaders: [{ test: /\.tsx?$/, loader: 'tslint', include: APP_DIR }],
        loaders: [
            { test: /\.json$/, loader: 'json' },
            { test: /\.tsx?$/, loaders: ['babel', 'ts'], include: APP_DIR },
            { test: /plugin\.css$/, loaders: ['style', 'css']}
        ]
    },
    externals: {
        "jquery": "$",
        "lodash": "_",
        "moment": "moment",
        "tv4": "tv4",
        "d3": "d3",
        "xlsx": "XLSX",

    },
    output: {
        filename: 'app.js',
        path: path.join(__dirname, '..', 'build'),
        publicPath: '/assets/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    resolve: {
        root: [path.resolve('../app')],
        alias: {
            react: path.resolve('./node_modules/react'),
        },
        extensions: ['', '.jsx', '.js', '.tsx', '.ts']
    }
};
