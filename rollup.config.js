import terser from '@rollup/plugin-terser';

const dev = {
    input: 'src/gantchart.js',
    output: {
        name: 'Gantt',
        file: 'dist/gantt.js',
        sourcemap: true,
        format: 'iife',
    },
    plugins: [
       
    ],
};
const prod = {
    input: 'src/gantchart.js',
    output: {
        name: 'Gantt',
        file: 'dist/gantt.min.js',
        sourcemap: true,
        format: 'iife',
    },
    plugins: [
        [terser()]
    ],
};

export default [dev, prod];