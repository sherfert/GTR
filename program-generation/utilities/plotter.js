/**
 * Created by jibesh on 18.03.16.
 */

(function () {
    const plotly = require('plotly')('JibeshPatra', 'vb6c5qalyc'); // My 'Username' and 'API key'
    const jsonfile = require('jsonfile');
    const fs = require('fs');

    const font = {
        // family: "Fira Sans Light",
        size: 18,
        color: "#7f7f7f"
    };


    function plot(content, outputFilename) {
        var maxY = Math.max(...content.y);
        var minY = Math.min(...content.y);
        var text1 = "Max " + maxY;
        var text2 = "Min " + minY;

        var x = {
                title: content.x_title,
                titlefont: font,
            },
            y = {
                title: content.y_title,
                titlefont: font
            }, layout = {
                title: content.title,
                xaxis: x,
                yaxis: y,
                showlegend: false,
                legend: {
                    x: 1,
                    y: 1,
                    bgcolor: '#E2E2E2',
                    bordercolor: '#FFFFFF',
                    borderwidth: 2
                }
            };

        var nameDataPlot = "(" + content.x_title + ", " + content.y_title + ")";


        var dataPlot = {
            x: content.x, // X axis of the plot
            y: content.y, // Y axis of the plot
            mode: "markers+text",
            name: ""
        };
        var xsum = content.x.reduce(function (pre, cur) {
            return pre + cur;
        });
        var ysum = content.y.reduce(function (pre, cur) {
            return pre + cur;
        });
        var xmean = xsum / content.x.length;
        var ymean = ysum / content.y.length;
        var annotationText = "Mean " + content.y_title + " " + ymean.toFixed(3);
        if (content.annotation) {
            layout.annotations = [
                {
                    x: 0,
                    y: maxY,
                    xref: 'x',
                    yref: 'y',
                    text: "Max: " + maxY.toFixed(2),
                    showarrow: true,
                    arrowhead: 7,
                    ax: 40,
                    ay: 0
                },
                {
                    x: xmean,
                    y: ymean,
                    xref: 'x',
                    yref: 'y',
                    text: annotationText,
                    showarrow: true,
                    arrowhead: 7,
                    ax: 0,
                    ay: -120
                }
            ]
        }
        if (content.plotmean) {

            var mean = {
                x: [xmean],
                y: [ymean],
                /*line: {
                 color: "rgb(214, 39, 40)",
                 dash: "solid",
                 width: 4
                 },*/
                name: "Mean",
                opacity: 0.5,
                mode: "markers",
                xaxis: "x",
                yaxis: "y"
            };
            var plotter = {
                'data': [dataPlot, mean],
                'layout': layout
            };
        } else {
            var plotter = {
                'data': [dataPlot],
                'layout': layout
            };
        }

        plotToImage(plotter, outputFilename);
    }

    function plotToImage(plotter, outputFilename) {
        var imgOpts = {
            format: 'eps',
            /*  width: 1400,
             height: 1000*/
        };

        plotly.getImage(plotter, imgOpts, function (error, imageStream) {
            if (error) return console.log(error);
            var fileStream = fs.createWriteStream(outputFilename);
            imageStream.pipe(fileStream);
        });
    }

    function standaloneRun() {
        var resultsDirectory = "../results/stats-and-plots/";
        var inputFileName = "generated-files-vs-nodes" + ".json";
        var outputPlotName = inputFileName.split(".json")[0] + ".eps";

        const content = jsonfile.readFileSync(resultsDirectory + inputFileName);
        plot(content, resultsDirectory + outputPlotName);
    }

    // standaloneRun();
    exports.plot = plot;
})();
