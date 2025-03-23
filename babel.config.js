export default {
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
        modules: 'auto'
      }
    ]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
      corejs: 3
    }]
  ]
}; 