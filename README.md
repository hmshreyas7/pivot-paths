# PivotPaths

This project is an implementation of [PivotPaths: Strolling through Faceted Information Spaces](https://mariandoerk.de/pivotpaths/infovis2012.pdf) using D3 v5 and articles from NY Times. The single facet anchor layout and a modified version of the resource layout mentioned in the paper are used here.

## Folders and Files

### /assets

This directory contains all icons required for the various kinds of nodes in the system and the image to be displayed for help information.

### /scripts

The `d3.min.js` file need for using D3 is included here. It can, however, be loaded directly using:
```
<script src="https://d3js.org/d3.v5.min.js"></script>
```
`pivot.js` is where all the interactions, transitions, and core aspects of the entire visualization are defined.

### index.html

Necessary JS and CSS files are included here. Various components such as the sorting widget, search box, detail overlay widget, and help information overlay are also defined.

### nyt.json

Data for roughly 1,200 articles from NY Times between March 2, 2019 and March 9, 2019 is available in this file. It was obtained from the NY Times Newswire API and formatted in an appropriate manner.

### style.css

This CSS file defines the styling for every aspect of the visualization.

## Running the system

Open the `index.html` file (Mozilla Firefox recommended) and use the search box for finding an author, news article, or topic. The help button in the top-left corner can be used for guidance, if required.
