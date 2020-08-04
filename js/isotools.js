function gaussian(data, height, center){
    let output = [];
    for (var i=0; i<data.length; i++){
        output[output.length] = height*
            Math.exp(-((data[i]-center)**2)/(2*width*width));
    }
    return output;
}
function range(start, end, increment) {
    if(start === end) return [start];
    let steps = Math.ceil((end-start)/increment);
    let output =[start];
    for (let i=1; i<=steps; i++){
        output[i] = roundTo(output[i-1] + increment, 2);
    }
    return output;
}
var f = []
function factorial(n){
    if(n==0 || n==1) return 1;
    if(f[n]>0) return f[n];

    return f[n]= factorial(n-1)*n;
}

function sumArray(array){
    let sum = 0;
    if(typeof array == 'number') return array;
    array.forEach(element => sum += element);
    return sum;
}
function roundTo(n, digits) {
     if (digits === undefined) {
       digits = 0;
     }
     let multiplicator = Math.pow(10, digits);
     n = parseFloat((n * multiplicator).toFixed(11));
     let test =(Math.round(n) / multiplicator);
     return +(test.toFixed(digits));
   }

function add2Arrays(first, second){
    if (first.length != second.length) return first;
    let out = [];
    for(let i=0; i<first.length; i++){
        out[i] = first[i] + second[i];
    }
    return out;
}
function addArrays(arrays){
    if(arrays.length === 1) return arrays[0];

    let output = Array(arrays[0].length).fill(0);
    for(let i=0; i<arrays.length; i++){
        output = add2Arrays(output, arrays[i]);
    }
    return output;
}

function abundance(number, abundances){
    let result = factorial(sumArray(number));
    for (let i=0; i<number.length; i++){
        result = result * (abundances[i] ** number[i]) / factorial(number[i]);
    }
    return result;
}
function getCombinations(nIsotopes, nAtoms){
    if(nIsotopes === 1){
     return [nAtoms];
    }
    let result = [];
    let result_st = [];
    let temp = Array(nIsotopes).fill(0);
    temp[0] = nAtoms;
    result[0] = temp;
    let previous = [temp];
    while(previous[0][0]!=0){
        temp = [];
        previous.forEach(comb =>{
            for(let i=1; i<nIsotopes; i++){
                let t = comb.slice(0);
                t[0] -= 1;
                t[i] += 1;
                if(!result_st.includes(t.toString())){
                    result.push(t);
                    result_st.push(t.toString());
                    temp.push(t);
                }
            }
        });
        previous = temp;
    }
    return result;
}
function elementDistribution(elementMass, elementAbundance, nAtoms){
    let combinations = getCombinations(elementMass.length, nAtoms);
    let masses = [];
    let abundances = [];
    for(let i=0; i<combinations.length; i++){
        let temp = abundance(combinations[i], elementAbundance);
        if(temp >= 0.01){
            let mass = 0;
            if(typeof combinations[i] === "number"){
                mass = elementMass[0] * combinations[i];
            }else{
            for(let j=0; j<elementMass.length; j++){
                mass += elementMass[j] * combinations[i][j];
            }
            }
            masses.push(mass);
            abundances.push(temp);
        }
    }
    return {'mass': masses, 'abundance': abundances};
}
function moleculeDistribution(elements, numbers){
    let prev = elementDistribution(elements[0].mass,
                        elements[0].abundance, numbers[0]);
    if(numbers.length==1) return prev;
    for(let i=1; i<numbers.length; i++){
        let combination = elementDistribution(elements[i].mass,
                        elements[i].abundance, numbers[i]);
        let mass = [];
        let ab = [];
        for (let k=0; k<prev.mass.length; k++){
            for (let j=0; j<combination.mass.length; j++){
            mass.push(prev.mass[k] + combination.mass[j]);
            ab.push(prev.abundance[k] * combination.abundance[j]);
            }
        }
        prev = {'mass': mass, 'abundance': ab};
    }
    return prev;
}
let width = 0.05;
let increment = 0.01;
function isoDistribution(element, height){
    let minMass = Math.floor(Math.min(...element.mass));
    let maxMass = Math.ceil(Math.max(...element.mass));
    if(Math.abs(minMass - Math.min(...element.mass)) < 0.5) minMass--;
    if(Math.abs(maxMass - Math.max(...element.mass)) < 0.5) maxMass++;
    return getDistribution(element, height, range(minMass, maxMass, increment));
}
function getDistribution(element, height, mass){
    let distribution = {
        'mass': mass,
        'intensity': [],
        'massStep': increment
    };

    distribution.intensity = gaussian(distribution.mass,
            element.abundance[0], element.mass[0], width);
    if(element.mass.length == 1){
        distribution.intensity = scaleArray(distribution.intensity, height);
        return distribution;
    }

    for(let i=1; i<element.mass.length; i++){
        distribution.intensity = addArrays([distribution.intensity,
                        gaussian(distribution.mass,
                            element.abundance[i],
                            element.mass[i], width)]);
    }
    distribution.intensity = scaleArray(distribution.intensity, height);
    return distribution;
}

function scaleArray(array, height){
    let max_ = Math.max(...array);
    for(let i=0; i<array.length; i++){
        array[i] /= max_;
        array[i] *= height;
    }
    return array;
}

function isLower(str){
    str = str.charCodeAt(0);
    return (str >= 97 && str < 123);
}
function isUpper(str){
    str = str.charCodeAt(0);
    return (str >= 65 && str < 91);
}
function isNumber(str){
    str = str.charCodeAt(0);
    return (str >= 48 && str < 58);
}
function errorNotification(msg){
    console.log('String: '+msg+' is not valid');
}

function getElements(string){
    string = string.trim();
    let output = {
        'name': string,
        'elements': [],
        'number': []};
    if(!isUpper(string[0])){
        errorNotification(string);
        return null;
    }
    let element = {'symbol': '', 'number': ''};
    for(let i=0; i<string.length; i++){
        if(element.symbol === ''){
            if(isUpper(string[i])){
                element.symbol = string[i];
            } else{
                errorNotification(string);
                return null;
            }
        }else{
            if(isLower(string[i]) && element.number === ''){
                element.symbol += string[i];
            }else if(isNumber(string[i])){
                element.number += string[i];
            }else if(isUpper(string[i])){
                if(element.number === ''){
                    element.number = '1';
                }
                if(element.symbol in elementsDB){
                    output.elements.push(elementsDB[element.symbol]);
                    output.number.push(parseInt(element.number));
                    element = {'symbol': string[i], 'number': ''};
                }else{
                    errorNotification(element.symbol);
                    return null;
                }
            }else{
                errorNotification(string);
                return null;
            }
        }
    }
    if(element.symbol !== ''){
        if(element.number == ''){
            element.number = '1';
        }
        if(element.symbol in elementsDB){
            output.elements.push(elementsDB[element.symbol]);
            output.number.push(parseInt(element.number));
        }else{
            errorNotification(element.symbol);
            return null;
        }
    }
    return output;
}
