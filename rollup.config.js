import { terser } from 'rollup-plugin-terser';

const dev = {
    input: 'js/gantchart.js',
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
    ],
};
const prod = {
    input: 'js/gantchart.js',
    output: {
        name: 'Gantt',
        file: 'dist/gantt.min.js',
        sourcemap: true,
        format: 'iife',
    },
    plugins: [
        sass({
            output: true,
            options: {
                outputStyle: 'compressed',
            },
        }),
        terser(),
    ],
};

export default [dev, prod];