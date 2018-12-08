import * as np from 'numjs'


export default class NeuralNet {
    constructor(nodeCount){
      this.fitness = 0.0
      this.nodeCount = nodeCount
      this.weights = []
      this.biases = []
      for (let i =0; i< this.nodeCount.length - 1; i++){
        this.weights.push( np.random([nodeCount[i], nodeCount[i+1]]))
        this.biases.push( np.random([nodeCount[i+1]]))
      }
    }
    getOutput = (input) => {
      let output = np.array(input);
      for (let i =0; i< this.nodeCount.length - 1; i++){
          output = np.dot(output, this.weights[i])
        }
      return output
    }
  }
