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
        commonjs(), // Handle CommonJS modules
        filesize(),
        nodeResolve(),
        typescript(),
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
        terser(), // Apply Terser plugin directly in the plugins array
    ],
};

export default [dev, prod];
