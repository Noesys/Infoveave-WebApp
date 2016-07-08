"use strict";
let path = require('path');
let webpack = require('webpack');

let APP_DIR = path.join(__dirname, '..', 'app');

module.exports = {
    devtool: 'source-map',
    entry: './app/index.tsx',
    module: {
        preLoaders: [{ test: /\.tsx?$/, loader: 'tslint', include: APP_DIR }],
        loaders: [
            { test: /\.json$/, loader: 'json' },
            { test: /\.tsx?$/, loaders: ['babel', 'ts'], include: APP_DIR },
            { test: /plugin\.css$/, loaders: ['style', 'css']}
            ]
    },
    output: {
        path: path.join(__dirname, '..', 'build'),
        filename: 'app.js',
        publicPath: '/assets/'
    },
    externals: {
        "jquery": "$",
        "lodash": "_",
        "moment": "moment",
        "tv4": "tv4",
        "d3": "d3",
        "xlsx": "XLSX",
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        })
    ],
    resolve: {
        root: [path.resolve('../app')],
        extensions: ['', '.jsx', '.js', '.tsx', '.ts']
    },
    tslint: {
        emitErrors: true,
        failOnHint: true
    }
}
