/**
 */

import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import GeneratePackageJsonPlugin from 'generate-package-json-webpack-plugin';
import pkg from '../package.json';

const isDebug = process.argv.includes('--debug');
const isVerbose = process.argv.includes('--verbose');
const isAnalyze = process.argv.includes('--analyze') || process.argv.includes('--analyse');

const basePackageValues = {
  name: pkg.name,
  version: pkg.version,
  private: true,
  engines: pkg.engines,
  scripts: {
    start: 'node --nouse-idle-notification --expose-gc web.js',
  },
  dependencies: {
    mysql2: '^2.1.0',
  },
};
const versionsPackageFilename = path.resolve(__dirname, '../package.json');

const config = {

  context: path.resolve(__dirname, '..'),

  mode: (isDebug) ? 'development' : 'production',

  output: {
    path: path.resolve(__dirname, '../build/public/assets'),
    publicPath: '/assets/',
    pathinfo: isVerbose,
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, '../src'),
        ],
        query: {
          // https://github.com/babel/babel-loader#options
          cacheDirectory: isDebug,

          // https://babeljs.io/docs/usage/options/
          babelrc: false,
          presets: [
            // A Babel preset that can automatically determine the Babel plugins and polyfills
            // https://github.com/babel/babel-preset-env
            ['@babel/preset-env', {
              targets: {
                browsers: pkg.browserslist,
              },
              modules: false,
              useBuiltIns: 'usage',
              corejs: {
                version: 3,
              },
              debug: false,
            }],
            "@babel/typescript",
            // JSX, Flow
            // https://github.com/babel/babel/tree/master/packages/babel-preset-react
            '@babel/react',
          ],
          plugins: [
            '@babel/transform-flow-strip-types',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-proposal-function-sent',
            '@babel/plugin-proposal-export-namespace-from',
            '@babel/plugin-proposal-numeric-separator',
            '@babel/plugin-proposal-throw-expressions',
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/proposal-object-rest-spread',
            // Adds component stack to warning messages
            // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-source
            ...isDebug ? ['@babel/transform-react-jsx-source'] : [],
            // Adds __self attribute to JSX which React will use for some warnings
            // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-self
            ...isDebug ? ['@babel/transform-react-jsx-self'] : [],
            // react-optimize
            '@babel/transform-react-constant-elements',
            '@babel/transform-react-inline-elements',
            'transform-react-remove-prop-types',
            'transform-react-pure-class-to-function',
          ],
        },
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'react-svg-loader',
            options: {
              svgo: {
                plugins: [
                  {
                    removeViewBox: false,
                  },
                  {
                    removeDimensions: true,
                  },
                ],
              },
              jsx: false, // true outputs JSX tags
            },
          },
        ],
      },
      {
        test: /\.html/,
        use: [
          {
            loader: 'html-loader',
            options: {
              attrs: [':data-src'],
            },
          },
        ],
      },
      {
        test: /\.tcss/,
        use: [
          {
            loader: 'css-loader',
            options: {
              // CSS Loader https://github.com/webpack/css-loader
              importLoaders: 1,
              sourceMap: isDebug,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: true,
            },
          },
        ],
      },
      {
        test: /\.scss/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              // CSS Loader https://github.com/webpack/css-loader
              importLoaders: 1,
              sourceMap: isDebug,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: false,
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.css/,
        use: ['style-loader',
          {
            loader: 'css-loader',
            options: {
              // CSS Loader https://github.com/webpack/css-loader
              sourceMap: isDebug,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: false,
            },
          },
        ],
      },
      {
        test: /\.md$/,
        loader: path.resolve(__dirname, './lib/markdown-loader.js'),
      },
      {
        test: /\.txt$/,
        loader: 'raw-loader',
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2)(\?.*)?$/,
        loader: 'file-loader',
        query: {
          name: isDebug ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]',
        },
      },
      {
        test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          name: isDebug ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]',
          limit: 10000,
        },
      },
    ],
  },

  // Don't attempt to continue if there are any errors.
  bail: !isDebug,

  cache: isDebug,

  stats: {
    colors: true,
    reasons: isDebug,
    hash: isVerbose,
    version: isVerbose,
    timings: true,
    chunks: isVerbose,
    chunkModules: isVerbose,
    cached: isVerbose,
    cachedAssets: isVerbose,
  },
};

const clientConfig = {
  ...config,

  name: 'client',
  target: 'web',

  devtool: 'source-map',

  entry: {
    client: ['./src/client.js'],
    globe: ['./src/globe.js'],
  },

  output: {
    ...config.output,
    filename: isDebug ? '[name].js' : '[name].[chunkhash:8].js',
    chunkFilename: isDebug ? '[name].chunk.js' : '[name].[chunkhash:8].js',
  },

  plugins: [
    // Define free variables
    // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      'process.env.BROWSER': true,
      __DEV__: isDebug,
    }),

    // Emit a file with assets paths
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve(__dirname, '../build'),
      filename: 'assets.json',
      prettyPrint: true,
    }),

    // Webpack Bundle Analyzer
    // https://github.com/th0r/webpack-bundle-analyzer
    ...isAnalyze ? [new BundleAnalyzerPlugin()] : [],
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false,
      cacheGroups: {
        default: false,
        vendors: false,

        vendor: {
          name: 'vendor',
          chunks: (chunk) => chunk.name === 'client',
          test: /node_modules/,
        },
      },
    },
  },

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  // https://webpack.github.io/docs/configuration.html#node
  // https://github.com/webpack/node-libs-browser/tree/master/mock
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
};


const webConfig = {
  ...config,

  name: 'web',
  target: 'node',

  entry: {
    web: ['./src/web.js'],
    backup: ['./src/backup.js'],
  },

  output: {
    ...config.output,
    path: path.resolve(__dirname, '../build'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },

  module: {
    ...config.module,

    // Override babel-preset-env configuration for Node.js
    rules: config.module.rules.map((rule) => (rule.loader !== 'babel-loader' ? rule : {
      ...rule,
      query: {
        ...rule.query,
        presets: rule.query.presets.map((preset) => (preset[0] !== '@babel/preset-env' ? preset : ['@babel/preset-env', {
          targets: {
            node: pkg.engines.node.replace(/^\D+/g, ''),
          },
          modules: false,
          useBuiltIns: false,
          debug: false,
        }])),
      },
    })),
  },

  // needed because webpack tries to pack socket.io
  externals: [
    /^\.\/assets\.json$/,
    (context, request, callback) => {
      const isExternal = request.match(/^[@a-z][a-z/.\-0-9]*$/i)
                && !request.match(/\.(css|less|scss|sss)$/i);
      callback(null, Boolean(isExternal));
    },
  ],

  plugins: [
    // Define free variables
    // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      'process.env.BROWSER': false,
      __DEV__: isDebug,
    }),
    // create package.json for deployment
    new GeneratePackageJsonPlugin(basePackageValues, versionsPackageFilename),
  ],

  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
  },

};

export default [clientConfig, webConfig];
