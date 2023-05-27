# AddThis

A CLI tool to automatically add or remove `this.` from class properties in JavaScript code, considering context code containing parent classes.

The assumption made by this program is that a reasonable dialect of JavaScript could exist where many instances of `this.` could be inferred by context.  Specifically methods of classes defined within the `class  { } ` block should be able to infer that references to fields of that class need a `this.`.

The rules that this translator uses to decide if `this.` should be inferrable are

1. A standalone identifier within matches a field of the current class (or parent if it can determine)
2. The standalone identifier has not been defined within the local context.

The theory is that any instance where these instances are identifiable can be converted back and forth so that standard JavaScript could be converted to this dialect and back, safely.

An example of this in practice is 
```JavaScript
class Rectangle {
  height = 0;
  width;
  constructor(height, width) {
	this.height = height;  // this. is required to distinguish between the field and the local
	this.width = width;
  }

  area() {
	return width * height;  // AddThis can automatically supply the this. to refer to class fields
  }	
}
```

AddThis can be run with -r to reverse the process turning normal JavaScript into this dialect.  This can help reduce cognitive load when reading JavaScript to understand what it is doing.  Even if you are not programming in this dialect, it may be of use to people who want a simpler view of the code.


There are instances where technically legal JavaScript would conflict with this translation. Specifically when a class has a field with the same name as a global and the code distinguishes between the field and the global by the use of `this.`.  If you use this tool, don't write JavaScript like that.  If you choose not to use this tool, also don't write JavaScript like that.


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
