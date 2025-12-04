const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../public/panoviewer/projects/춘천 프리미엄빌리지/폴대위치 선정을 위한 3D스캔 분석');
const targetDir = path.join(__dirname, '../public/data/chuncheon');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.readdir(sourceDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.html' && file.startsWith('density_map_cluster_')) {
            const filePath = path.join(sourceDir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Find start of Plotly.newPlot call
            const startIdx = content.indexOf('Plotly.newPlot(');
            if (startIdx !== -1) {
                // Find the arguments part
                let openParens = 0;
                let endIdx = -1;
                let inString = false;
                let stringChar = '';

                // Start scanning after 'Plotly.newPlot('
                for (let i = startIdx + 15; i < content.length; i++) {
                    const char = content[i];

                    if (inString) {
                        if (char === stringChar && content[i - 1] !== '\\') {
                            inString = false;
                        }
                    } else {
                        if (char === '"' || char === "'") {
                            inString = true;
                            stringChar = char;
                        } else if (char === '(') {
                            openParens++;
                        } else if (char === ')') {
                            if (openParens === 0) {
                                endIdx = i;
                                break;
                            }
                            openParens--;
                        }
                    }
                }

                if (endIdx !== -1) {
                    const argsStr = content.substring(startIdx + 15, endIdx);
                    try {
                        // Wrap in array to parse as JSON arguments
                        // We need to be careful if the first arg is a string with quotes
                        // The argsStr should be like: "id", [data], {layout}
                        // Wrapping in [] makes it ["id", [data], {layout}] which is valid JSON
                        const args = JSON.parse(`[${argsStr}]`);

                        if (args.length >= 3) {
                            const data = args[1];
                            const layout = args[2];

                            const output = {
                                data: data,
                                layout: layout
                            };

                            const outputFilename = file.replace('.html', '.json').replace('density_map_', '');
                            const outputPath = path.join(targetDir, outputFilename);

                            fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
                            console.log(`Extracted data from ${file} to ${outputFilename}`);
                        } else {
                            console.warn(`Not enough arguments in Plotly.newPlot in ${file}`);
                        }
                    } catch (e) {
                        console.error(`Error parsing JSON in ${file}:`, e.message);
                        // console.log('Args string snippet:', argsStr.substring(0, 100));
                    }
                } else {
                    console.warn(`Could not find closing parenthesis for Plotly.newPlot in ${file}`);
                }
            } else {
                console.warn(`No Plotly.newPlot found in ${file}`);
            }
        }
    });
});
