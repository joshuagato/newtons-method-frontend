import React, { Component } from 'react';
import './Input.scss';
import axios from 'axios';

import { create, all } from 'mathjs/number';
const math = create(all);

let Parser = require('expr-eval').Parser;
// let parser = new Parser();


class Input extends Component {

    constructor(props) {
        super(props);

        this.state = {
            function: '',
            root: null,
            error: null,
            syntaxError: null,
            buttonDisabled: true
        };

        this.newtonsMethod = x => {
            let i, xnew;

            for (i=1; i<=200; i++) {
                xnew = x - (2*x**3 - 9.5*x + 7.5) / (6*x**2 - 9.5);

                console.log("FUNC", 2*x**3 - 9.5*x + 7.5);
                console.log("DERIV", 6*x**2 - 9.5);
                console.log("DIVISIN", (2*x**3 - 9.5*x + 7.5) / (6*x**2 - 9.5));
                console.log("ROOT", xnew);
                console.log("X-up", x);

                if(Math.abs(xnew - x) < 0.000001) {
                    console.log('top-level');
                    break;
                }

                x = xnew;
            }

            
                console.log("X-down", x);

            // console.log("The root is: ", xnew, "at: ", i, " iterations.");
            console.log("Root-top", xnew);
            console.log("Iterations-top", i);
        }
    }

    inputHandler = event => {
        let inputFunction = event.target.value;

        const regex = RegExp(/\d*x\^+[0-9]+/);
        if(!regex.test(inputFunction)) {
            this.setState({ syntaxError: 'Please enter a polynomial function', buttonDisabled: true });
            return;
        }
        
        this.setState({ function: inputFunction, syntaxError: null, buttonDisabled: false });
        
        const graphqlQuery = {
            query: `
                query FetchCalculations($input: String!) {
                    retriveCalculation(inputFunction: $input) {
                        root
                    }
                }
            `,
            variables: { input: inputFunction }
        };

        axios.post('http://localhost:4005/graphql', graphqlQuery).then(response => {
            console.log("RESULT:", response.data.data.retriveCalculation.root);
            this.setState({ root: response.data.data.retriveCalculation.root, error: null, buttonDisabled: true })
        })
        .catch(error => {
            console.log("ERROR:", error.response.data.errors[0].message);
            this.setState({ root: null, error: error.response.data.errors[0].message })
        });
    }

    calculate = event => {
        event.preventDefault();

        this.setState({ function: '', root: null, error: null })

        // const inputValue = this.refs.input.value;
        const func = this.refs.input.value;
        // this.newtonsMethod(inputValue);
        // this.newtonsMethod(5);

        const diff = 'x';
        let deriv = math.derivative(func, diff).toString();

        let newFunc = func.replace(/([0-9]+)(x)/g, "$1*$2");
        // let newFunc = func.replace(/\^/g, "**");
        // newFunc = newFunc.replace(/([0-9]+)(x)/g, "$1*$2");
        // newFunc = newFunc.replace(/(\+)/g, " $1 ");

        // let newDeriv = deriv.replace(/\^/g, "**");

        // 2x^3 + 2x^2 + 4x + 3
        // 2x^3 - 9.5x + 7.5
        // 2*x^3 - 9.5*x + 7.5

        let i, root;
        let x = 5;

            for (i=1; i<= 200; i++) {

                let newParsedFunc = Parser.evaluate('func', { func: newFunc });
                newParsedFunc = Parser.evaluate(newParsedFunc, { x: x });

                let newParsedDeriv = Parser.evaluate('deriv', { deriv: deriv });
                newParsedDeriv = Parser.evaluate(newParsedDeriv, { x: x });

                // x = 4;
                // console.log("XXX", x);
                root = x - newParsedFunc / newParsedDeriv;

                if(Math.abs(root - x) < 0.000001) {
                    console.log('bottom-level');
                    break;
                }

                x = root;
            }

        this.setState({ function: func, root: root });

        const graphqlQuery = {
            query: `
                mutation createNewCalculation($function: String!, $root: Float!) {
                    createCalculation(inputData: { function: $function, root: $root })
                }
            `,
            variables: { function: func, root: root }
        }

        axios.post('http://localhost:4005/graphql', graphqlQuery);

        // console.log("X-down", x);
        console.log("Root-bottom", root);
        console.log("Iterations-bottom", i);

        this.refs.input.value = null;
    }

    render() {
        let displayInfo;

        if(this.state.root && !this.state.error && !this.state.syntaxError) {
            displayInfo = (<p className="solution">The <b>root</b> of the function: 
                <b> {this.state.function}</b> ===>>> <b>{this.state.root}</b></p>);
        }
        else if (this.state.syntaxError) {
            displayInfo = (<p className="tip"><b>{this.state.syntaxError}</b></p>);
        }
        else {
            displayInfo = (<p className="tip"><b>Please Click on the SOLVE button to CALCULATE</b></p>);
        }

        return (
            <div className="input-div">
                <form onSubmit={this.calculate}>
                    {/* <input ref="input" type="number" placeholder="Enter your expression here..." step="0.01" required /> */}
                    <input ref="input" type="text" placeholder="Enter your function here... E.g 2x^3 + 2x^2 + 4x + 1"
                         step="0.01" onChange={this.inputHandler} />
                    <button disabled={this.state.buttonDisabled}>SOLVE</button>
                    
                    {displayInfo}
                    
                </form>
            </div>
        );
    }
}

export default Input;
