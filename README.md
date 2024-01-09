# Project Name - Gantt Chart
    -A gantt package written in  TypeScript language for generating Gantt charts. This package allows developers to easily populate data from an API and visualize it in Gantt chart format.

Brief introduction or description of your Gantt chart package.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the package, use the following command:
 -npm install 
 -npm run dev

## Usage

Instructions on how to use your package.

import GanttChart from 'gantchart';
const gant=new GanttChart(data);

# Populating Data from API

// Fetch data from API
const fetchData = async () => {
  try {
    const data = await fetch('https://your-api-url/data');
    const jsonData = await data.json();
    gantt.setData(jsonData); // Set data to Gantt chart
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

fetchData();



## API Reference

`setData(data: any): void`
Sets the data for the Gantt chart.
`data - The data retrieved from the API.`
`fetchDataFromAPI(): Promise<any>`
Fetches data from the specified API endpoint.

## Examples



## Contributing

Guidelines for contributors. How they can contribute to the project.

## License

