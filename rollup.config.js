import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const dev = {
    input: 'src/gantchart.ts',
    output: {
        name: 'Gantt',
        file: 'dist/gantt.js',
        sourcemap: true,
        format: 'iife',
    },
    plugins: [
        typescript(), // Place typescript plugin before commonjs
        commonjs(), // Handle CommonJS modules
        filesize(),
        nodeResolve(),
        peerDepsExternal(),
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
        typescript(),
        terser(),
    ],
};

export default [dev, prod];
