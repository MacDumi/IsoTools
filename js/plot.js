window.chartColors = {
    red: 'rgb(255, 99, 132)',
    blue: 'rgb(54, 162, 235)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    orange: 'rgb(255, 159, 64)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};
let blackCol = 'rgb(20, 20, 20)';
document.getElementById("height").defaultValue = "100";
function adjustArray(mass, oldMass, oldIntensity){
        console.log(mass.length);
        console.log(oldMass.length);
        console.log(oldIntensity.length);
    if(mass[0] < oldMass[0]){
        let idx = mass.indexOf(oldMass[0]);
        oldIntensity = Array(idx).fill(0).concat(oldIntensity);
    }
    if(mass[mass.length-1] > oldMass[oldMass.length-1]){
        let idx = mass.length - mass.indexOf(oldMass[oldMass.length-1]);
        oldIntensity = oldIntensity.concat(Array(idx-1).fill(0));
    }
    return oldIntensity;
}

function formulaToDistribution(formula, height){
    let name = formula;
    let output = {'name': formula,
                  'elements': null,
                  'number': null,
                  'masses': null,
                  'abundance': null,
                  'mass': null,
                  'intensity': null,
                  'massStep': null,
                  'height': height
                  }
    formula = getElements(formula);
    if(formula === null){
        swal("Input Error", "Not a valid formula", "error");
        return null;
    }
    output.elements = formula.elements;
    output.number = formula.number;
    formula = moleculeDistribution(output.elements, output.number);
    output.masses = formula.mass;
    output.abundance = formula.abundance;
    let distribution = isoDistribution(formula, height);
    output.mass = distribution.mass;
    output.intensity = distribution.intensity;
    output.massStep = distribution.massStep;
    return output;
}

let sample = formulaToDistribution('C16H10', 100);
sample.name = 'Sample Data';

let currentData ={sample};

let config = {
            type: 'line',
            data: {
                labels: sample.mass,
                datasets: [{
                    label: sample.name,
                    backgroundColor: window.chartColors.red,
                    borderColor: window.chartColors.red,
                    data: sample.intensity,
                    fill: false,
                }]
            },
            options: {
                elements: {
                    point: {
                        hitRadius: 0,
                        hoverRadius: 0,
                        radius: 0
                    }
                },
                responsive: true,
                tooltips: {
                    enabled: false
                },
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'mass',
                            fontSize: 18
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Intensity',
                            fontSize: 18
                        }
                    }]
                }
            }
        };
window.onload = function() {
            var ctx = document.getElementById('myChart').getContext('2d');
            window.myLine = new Chart(ctx, config);
        }
document.getElementById("saveImage").addEventListener('click', function(){
          var url_base64jp = document.getElementById("myChart").toDataURL("image/jpg");
          var a =  document.getElementById("saveImage");
          a.href = url_base64jp;
});
var colorNames = Object.keys(window.chartColors);

document.getElementById('addDataset').addEventListener('click', function() {
            let molecule = document.getElementById("formula").value;
            let height = document.getElementById("height").value;
            if(molecule.trim() === ""){
                swal("Input Error", "Not a valid formula", "error");
                return;
            }
            if(height.trim() === ""){
                swal("Input Error", "Not a valid height", "error");
                return;
            }
            let newMolecule = formulaToDistribution(molecule, height);
            addLine(newMolecule);
        });

document.getElementById('clear').addEventListener('click', function() {clearChart();});

document.getElementById('download').addEventListener('click', function() {
    let exportData = {};
    for(const key in currentData){
        exportData[key] = {'elements' : currentData[key].elements,
                           'masses'   : currentData[key].masses,
                           'abundance': currentData[key].abundance}
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], {
                                    type: "text/plain" }));
    a.setAttribute("download", "data.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById('removeItem').addEventListener('click', function() {
    let list = document.getElementById('currentData');
    for(let i=0; i<list.options.length; i++){
        if(list.options[i].selected) {
            let name = list.options[i].innerHTML;
            list.remove(i);
            removeLine(name);
        }
    }
});
function addListItem(formula){
    var x=document.getElementById("currentData");
    var option=document.createElement("option");
    if(formula.name == undefined){
        option.text = formula;
    }else{
        option.text=formula.name;
    }
    x.add(option);
}
function clearList(){
    let list = document.getElementById('currentData');
    for(let i=list.options.length-1; i>=0; i--){
        list.remove(i);
    }
}

function recalculate(){
    let minMass = [];
    let maxMass = [];
    for(const key in currentData){
        minMass.push(Math.min(...currentData[key].masses));
        maxMass.push(Math.max(...currentData[key].masses));
    }
    let lowLimit = Math.floor(Math.min(...minMass));
    let highLimit = Math.ceil(Math.max(...maxMass));
    if(Math.abs(lowLimit - Math.min(...minMass)) < 0.5) lowLimit--;
    if(Math.abs(highLimit - Math.max(...maxMass)) < 0.5) highLimit++;

    if((highLimit - lowLimit)/increment > 5000 || (highLimit - lowLimit)/increment <2500){
        increment = (highLimit - lowLimit) / 5000;
        if(increment < 0.01) increment = 0.01;
        }
    let mass = range(lowLimit, highLimit, increment);
    config.data.labels = mass;
    let i = 0;
    for(const key in currentData){
        let newDistribution = getDistribution({'mass': currentData[key].masses,
                                               'abundance': currentData[key].abundance},
                                                currentData[key].height,
                                                config.data.labels);
        currentData[key].mass = newDistribution.mass;
        currentData[key].intensity = newDistribution.intensity;
        config.data.datasets[i].data = currentData[key].intensity;
        config.data.datasets[i].label = key;
        i++;
    }

    let cumulative = Array(config.data.labels.length).fill(0);
    for(i=0; i<config.data.datasets.length-1; i++){
        cumulative = add2Arrays(cumulative, config.data.datasets[i].data);
    }
    config.data.datasets[config.data.datasets.length-1].data = cumulative;
}

function removeLine(name){
    delete currentData[name];
    let prevCol = null;
    let index = 0;
    for(i=0; i<config.data.datasets.length-1; i++){
        if(config.data.datasets[i].label === name) {
        config.data.datasets.splice(i, 1);
        }
    }
    recalculate();
    for(i=0; i<config.data.datasets.length-1; i++){
        let colorName = colorNames[i% colorNames.length];
        let newColor = window.chartColors[colorName];
        config.data.datasets[i].backgroundColor = newColor;
        config.data.datasets[i].borderColor = newColor;
    }
    window.myLine.update();
}

function addLine(dist){
            if(dist === null) return;
            if(config.data.datasets.length == 1 && config.data.datasets[0].label === 'Sample Data'){
                clearList();
                currentData = {};
                var newDataset = [{
                    label: dist.name,
                    backgroundColor: window.chartColors.red,
                    borderColor: window.chartColors.red,
                    data: dist.intensity,
                    fill: false
                },{
                    label: 'Cumulative',
                    backgroundColor: blackCol,
                    borderColor: blackCol,
                    data: dist.intensity,
                    fill: false
                }];
                config.data.labels = dist.mass;
                config.data.datasets = newDataset;
                currentData[dist.name] = dist;
            }else{
                var colorName = colorNames[(config.data.datasets.length - 1 )% colorNames.length];
                var newColor = window.chartColors[colorName];
                var newDataset = {
                    label: dist.name,
                    backgroundColor: newColor,
                    borderColor: newColor,
                    data: [],
                    fill: false
                };


                newDataset.data = dist.intensity;
                config.data.datasets.splice(0, 0, newDataset);
                currentData[dist.name] = dist;
                recalculate();
            }


            window.myLine.update();
            addListItem(dist);

}

function clearChart(){
            config.data.datasets = [{
                label: sample.name,
                backgroundColor: window.chartColors.red,
                borderColor: window.chartColors.red,
                data: sample.intensity,
                fill: false
            }];
            config.data.labels = sample.mass;
            window.myLine.update();
            clearList();
            addListItem('Sample Data');
    }
