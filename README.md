# AddThis

A CLI tool to add or remove 'this.' from class properties in JavaScript code, considering context code containing parent classes.

## Installation

Clone the repository and run `npm install` to install the dependencies.

````
git clone https://github.com/Lerc/addthis.git
cd addthis
npm install
````

## Usage

````
node addthis.js [options]
````

### Options:

- `-c, --context <files...>`: Specify one or more context files. The context files should contain JavaScript code with definitions of parent classes.
- `-r, --remove`: If this option is specified, 'this.' will be removed from class properties in the input code.
- `-i, --input <file>`: Specify the input file. If no input file is specified, the script will read from stdin.
- `-o, --output <file>`: Specify the output file. If no output file is specified, the script will write to stdout.

## Examples

### Add 'this.' to class properties:

````
echo 'class Child { prop=0; method() { prop = 42; notProp=0 } }' | node addthis.js 
````

````
node addthis.js -c testContext.js -i testInput.js

````

### Remove 'this.' from class properties:

````
echo 'class Child  { prop=0; method() { this.prop = 42; notProp=0 } }' | node addthis.js  -r
````


### Perform a round trip adding and removing this. :
````
node addthis.js -c testContext.js -i testInput.js | node addThis -r -c testContext.js

````
