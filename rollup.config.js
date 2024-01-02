import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import sass from 'rollup-plugin-sass';


const dev = {
  input: 'src/gantchart.ts',
  output: {
    name: 'Gantt',
    file: 'dist/gantt.js',
    sourcemap: true,
    format: 'iife',
  },
  plugins: [
    sass({
      output: true,
    }),
    peerDepsExternal(),
    nodeResolve(),
    commonjs(), // Handle CommonJS modules after resolving external dependencies
    typescript(), // Place typescript plugin after commonjs
    filesize(),
  ],
};

const prod = {
  input: 'src/gantchart.ts',
  output: {
    name: 'Gantt',
    file: 'dist/gantt.min.js',
    sourcemap: true,
    format: 'iife',
  },
  plugins: [
    sass({
      output: true,
    }),
    typescript(),
    terser(),
  ],
};

export default [dev, prod];
