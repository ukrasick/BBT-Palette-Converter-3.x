/**
 * eval-calculation.js
 * evaluate calculation formula.
 *
 * @version 1.0.0
 * @author think49
 * @url https://gist.github.com/think49/54b074cab2145efddb48765652c74710
 * @license http://www.opensource.org/licenses/mit-license.php (The MIT License)
 */

 var evalCalculation = (function (String, pow, max) {
    'use strict';
  
    function getDecimalPartLength (numberString) {
      var result = /\.\d+$/.exec(numberString);
  
      return result ? result[0].length - 1 : 0;
    }
  
    var calcMultiplyOrDivide = (function (push) {
      return function calcMultiplyOrDivide (expression) {
        var multiplyOrDivide = /\*(-?(?:\d+(?:\.\d+)?|\.\d+))|\/(-?(?:\d+(?:\.\d+)?|\.\d+))|(-?(?:\d+(?:\.\d+)?|\.\d+))/g, multiply = [], divide = [], number, token, i, len;
  
        while (token = multiplyOrDivide.exec(expression)) {
          if (token[1]) {
            multiply.push(['*', token[1]]);
          } else if (token[2]) {
            divide.push(['/', token[2]]);
          } else if (token[3]) {
            number = token[3];
          } else {
            throw new Error('Unknown exception');
          }
        }
  
        push.apply(multiply, divide);  // multiply before divide
        i = 0;
        len = multiply.length;
        expression = number;
  
        while (i < len) {
          token = multiply[i++];
          number = calcDyadicOperator('', number, token[0], token[1])
        }
  
        return number;
      };
    }(Array.prototype.push));
  
    function calcDyadicOperator (matched, number1, operator, number2) {
      var decimalPart = /\.\d+$/, powerNumber1, powerNumber2, result;
  
      switch (operator) {
        case '+':
          powerNumber1 = pow(10, max(getDecimalPartLength(number1), getDecimalPartLength(number2)));
          result = (powerNumber1 * number1 + powerNumber1 * number2) / powerNumber1;
          break;
        case '-':
          powerNumber1 = pow(10, max(getDecimalPartLength(number1), getDecimalPartLength(number2)));
          result = (powerNumber1 * number1 - powerNumber1 * number2) / powerNumber1;
          break;
        case '*':
          powerNumber1 = pow(10, getDecimalPartLength(number1));
          powerNumber2 = pow(10, getDecimalPartLength(number2));
          result = (number1 * powerNumber1) * (number2 * powerNumber2) / (powerNumber1 * powerNumber2);
          break;
        case '/':
          powerNumber1 = pow(10, max(getDecimalPartLength(number1), getDecimalPartLength(number2)));
          result = (number1 * powerNumber1) / (number2 * powerNumber1);
          break;
        default:
          console.warn('expression: ' + number1 + operator + number2);
          throw new SyntaxError(operator + ' is not a operator');
      }
  
      return result;
    }
  
    function removeParentheses (matched, number) {
      return number;
    }
  
    return function evalCalculation (expression) {
      var multiplyOrDivide = /-?(?:\d+(?:\.\d+)?|\.\d+)(?:[*/]-?(?:\d+(?:\.\d+)?|\.\d+))+/g,
          addOrSubtract = /(-?(?:\d+(?:\.\d+)?|\.\d+))([+-])(-?(?:\d+(?:\.\d+)?|\.\d+))/g,
          numberWithParentheses = /\((-?(?:\d+(?:\.\d+)?|\.\d+))\)/g,
          illegalString;
  
      expression = String(expression).replace(/\s+/g, '');
  
      if (illegalString = /^(?!-?(?:\d+(?:\.\d+)?|\.\d+)|\()[\s\S]/.exec(expression)) {
        throw new SyntaxError('An expression starts with an unexpected token: ' + illegalString[0]);
      }
  
      if (illegalString = /[^\d)]$/.exec(expression)) {
        throw new SyntaxError('An expression ends with an unexpected token: ' + illegalString[0]);
      }
  
      if (illegalString = /\d*(?:\.\d*){2,}/.exec(expression)) {
        throw new SyntaxError('Illegal number: ' + illegalString[0]);
      }
  
      do {
        expression = expression.replace(numberWithParentheses, removeParentheses);
  
        while (multiplyOrDivide.test(expression)) {
          expression = expression.replace(multiplyOrDivide, calcMultiplyOrDivide);
        }
  
        while (addOrSubtract.test(expression)) {
          expression = expression.replace(addOrSubtract, calcDyadicOperator);
        }
  
      } while (numberWithParentheses.test(expression));
  
      if (illegalString = /[^\d.+-]/.exec(expression)) {
        throw new SyntaxError('An expression with an unexpected token: ' + illegalString[0])
      }
  
      return +expression; // ToNumber
    };
  }(String, Math.pow, Math.max));