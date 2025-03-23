module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          browsers: ['last 2 versions', 'not dead']
        },
        useBuiltIns: 'usage',
        corejs: 3,
        modules: false
      }
    ]
  ],
  plugins: ['@babel/plugin-transform-runtime']
}; 