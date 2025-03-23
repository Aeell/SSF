import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        main: './src/client/index.js',
        game: './src/client/game/Game.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: isDevelopment ? '[name].bundle.js' : '[name].[contenthash].js',
        clean: true
    },
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-transform-runtime'
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[name].[hash][ext]'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/fonts/[name].[hash][ext]'
                }
            },
            {
                test: /\.(glb|gltf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/models/[name].[hash][ext]'
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Super Slam Football',
            template: './src/client/index.html',
            inject: 'body',
            scriptLoading: 'defer'
        }),
        ...(isDevelopment ? [] : [
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css'
            })
        ])
    ],
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        },
        ...(isDevelopment ? {} : {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: false
                        }
                    },
                    extractComments: false
                }),
                new CssMinimizerPlugin()
            ]
        })
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
            watch: true
        },
        hot: false,
        liveReload: true,
        compress: true,
        port: 3000,
        proxy: [
            {
                context: ['/socket.io'],
                target: 'http://localhost:3001',
                ws: true,
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/api'],
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/assets'],
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        ],
        historyApiFallback: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        client: {
            overlay: {
                errors: true,
                warnings: false
            },
            logging: 'info'
        }
    },
    resolve: {
        extensions: ['.js'],
        fallback: {
            "path": false,
            "fs": false
        }
    }
}; 