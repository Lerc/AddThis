const { parse } = require("@babel/parser");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const program = require('commander');
const fs = require('fs');

/**
 * Adds 'this.' to unqualified references to class properties 
 * in JavaScript code, considering parent classes in the provided context.
 *
 * @param {string} context - JavaScript code containing definitions of classes that
 *                           may be parents of classes in the code to be transformed.
 * @param {string} code - The JavaScript code to be transformed.
 * @returns {string} The transformed code, with 'this.' prepended to unqualified
 *                   references to class properties.
 */
function thisPrepender(context, code) {
  const contextAst = parse(context, { sourceType: "module" });
  const codeAst = parse(code, { sourceType: "module" });

  const classProperties = {};

  const visitor = {
    ClassDeclaration(path) {
      const className = path.node.id.name;
      classProperties[className] = getClassProperties(path);
    },
    ClassExpression(path) {
      if (path.node.id) {
        const className = path.node.id.name;
        classProperties[className] = getClassProperties(path);
      }
    },
  };

  // First pass: collect class properties from context and code
  traverse(contextAst, visitor);
  traverse(codeAst, visitor);

  const prependerVisitor = {
    ClassDeclaration(path) {
      const className = path.node.id.name;
      const superClass = path.node.superClass;

      if (superClass && t.isIdentifier(superClass)) {
        const superClassProperties = classProperties[superClass.name] || [];
        updateIdentifiers(path, [...(classProperties[className] || []), ...superClassProperties]);
      } else {
        updateIdentifiers(path, classProperties[className] || []);
      }
    },
    ClassExpression(path) {
      if (path.node.id) {
        const className = path.node.id.name;
        const superClass = path.node.superClass;

        if (superClass && t.isIdentifier(superClass)) {
          const superClassProperties = classProperties[superClass.name] || [];
          updateIdentifiers(path, [...(classProperties[className] || []), ...superClassProperties]);
        } else {
          updateIdentifiers(path, classProperties[className] || []);
        }
      } else {
        updateIdentifiers(path, getClassProperties(path));
      }
    },
  };

  // Second pass: prepend 'this' to class properties in code
  traverse(codeAst, prependerVisitor);

  return generate(codeAst, { retainLines: true }).code;
}

function getClassProperties(path) {
  let properties = [];
  path.traverse({
    ClassProperty(path) {
      if (t.isIdentifier(path.node.key)) {
        properties.push(path.node.key.name);
      }
    },
    ClassMethod(path) {
      if (t.isIdentifier(path.node.key)) {
        properties.push(path.node.key.name);
      }
    },
  });
  return properties;
}


function updateIdentifiers(path, classProperties) {
  path.traverse({
    Identifier(path) {
      if (classProperties.includes(path.node.name)) {
        let scope = path.scope;
        while (scope) {
          if (scope.hasOwnBinding(path.node.name)) {
            return; // Identifier is defined locally, so do not prepend 'this.'
          }
          scope = scope.parent;
        }
        // Identifier is not defined locally, not a key of a class property or method, and not already a property of a MemberExpression.
        if (!(t.isClassProperty(path.parent, { key: path.node }) || t.isClassMethod(path.parent, { key: path.node })) && !path.parentPath.isMemberExpression({ property: path.node })) {
          path.replaceWith(t.memberExpression(t.thisExpression(), t.identifier(path.node.name)));
        }
      }
    },
  });
}

/**
 * Removes 'this.' from qualified references to class properties in 
 * JavaScript code, considering parent classes in the provided context.
 *
 * @param {string} context - JavaScript code containing definitions of classes that
 *                           may be parents of classes in the code to be transformed.
 * @param {string} code - The JavaScript code to be transformed.
 * @returns {string} The transformed code, with 'this.' removed from qualified
 *                   references to class properties.
 */
function thisRemover(context, code) {
  const contextAst = parse(context, { sourceType: "module" });
  const codeAst = parse(code, { sourceType: "module" });

  const classProperties = {};

  const visitor = {
    ClassDeclaration(path) {
      const className = path.node.id.name;
      classProperties[className] = getClassProperties(path);
    },
    ClassExpression(path) {
      if (path.node.id) {
        const className = path.node.id.name;
        classProperties[className] = getClassProperties(path);
      }
    },
  };

  // First pass: collect class properties from context and code
  traverse(contextAst, visitor);
  traverse(codeAst, visitor);

  const removerVisitor = {
    ClassDeclaration(path) {
      const className = path.node.id.name;
      const superClass = path.node.superClass;

      if (superClass && t.isIdentifier(superClass)) {
        const superClassProperties = classProperties[superClass.name] || [];
        removeThisReferences(path, [...(classProperties[className] || []), ...superClassProperties]);
      } else {
        removeThisReferences(path, classProperties[className] || []);
      }
    },
    ClassExpression(path) {
      if (path.node.id) {
        const className = path.node.id.name;
        const superClass = path.node.superClass;

        if (superClass && t.isIdentifier(superClass)) {
          const superClassProperties = classProperties[superClass.name] || [];
          removeThisReferences(path, [...(classProperties[className] || []), ...superClassProperties]);
        } else {
          removeThisReferences(path, classProperties[className] || []);
        }
      } else {
        removeThisReferences(path, getClassProperties(path));
      }
    },
  };

  // Second pass: remove 'this' references from code
  traverse(codeAst, removerVisitor);

  return generate(codeAst, { retainLines: true }).code;
}

function removeThisReferences(path, classProperties) {
  path.traverse({
    MemberExpression(path) {
      if (
        t.isThisExpression(path.node.object) &&
        t.isIdentifier(path.node.property) &&
        classProperties.includes(path.node.property.name)
      ) {
        let scope = path.scope;
        while (scope) {
          if (scope.hasOwnBinding(path.node.property.name)) {
            return; // Identifier is defined locally, so do not remove 'this.'
          }
          scope = scope.parent;
        }
        // Identifier is not defined locally, not a key of a class property or method, and not already a property of a MemberExpression.
        if (
          !(t.isClassProperty(path.parent, { key: path.node }) || t.isClassMethod(path.parent, { key: path.node })) &&
          !path.parentPath.isMemberExpression({ property: path.node })
        ) {
          path.replaceWith(t.identifier(path.node.property.name));
        }
      }
    },
  });
}


program
  .option('-c, --context <files...>', 'Context file(s)')
  .option('-r, --remove', 'Remove "this."')
  .option('-i, --input <file>', 'Input file')
  .option('-o, --output <file>', 'Output file')
  .parse(process.argv);

const options = program.opts();

const contextFiles = options.context || [];
let context = '';

contextFiles.forEach(file => {
  context += fs.readFileSync(file, 'utf8');
});

const readInput = new Promise((resolve, reject) => {
  let input = '';

  if (options.input) {
    input = fs.readFileSync(options.input, 'utf8');
    resolve(input);
  } else {
    process.stdin.setEncoding('utf8');
  
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        input += chunk;
      }
    });
  
    process.stdin.on('end', () => {
      resolve(input);
    });
  
    process.stdin.on('error', (err) => {
      reject(err);
    });
  }
});

readInput
  .then(input => {
    let output = '';
    if (options.remove) {
      output = thisRemover(context, input);
    } else {
      output = thisPrepender(context, input);
    }
  
    if (options.output) {
      fs.writeFileSync(options.output, output, 'utf8');
    } else {
      process.stdout.write(output);  // write to stdout if no output file is specified
    }
  })
  .catch(err => {
    console.error(err);
  });


  