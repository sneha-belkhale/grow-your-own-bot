import * as np from 'numjs'

import NeuralNet from './NeuralNet'

export default class Population {
    constructor(populationCount, mutationRate, nodeCount){
        this.nodeCount = nodeCount
        this.popCount = populationCount
        this.population = []

        for (let i = 0; i < populationCount; i++){
          this.population.push(new NeuralNet(nodeCount))
        }
        this.m_rate = mutationRate
      }
      length = (pos1, pos2) => {
        return (pos2[0] - pos1[0])*(pos2[0] - pos1[0])+ (pos2[1] - pos1[1])*(pos2[1] - pos1[1])
      }

      createChild = (nn1, nn2) => {
        let child = new NeuralNet(this.nodeCount)
        for (let i = 0; i < child.weights.length; i++){
          for (let j = 0; j < child.weights[i].length; j++){
            for (let k = 0; k < child.weights[i][j].length; k++){
                    if (Math.random() > this.m_rate){
                      if (Math.random() < nn1.fitness / (nn1.fitness+nn2.fitness)) {
                        child.weights[i][j][k] = nn1.weights[i][j][k]

                      } else {
                          child.weights[i][j][k] = nn2.weights[i][j][k]
                    }
                  }}}}


                  for (let i = 0; i < child.biases.length; i++){
                    for (let j = 0; j < child.biases[i].length; j++){
                      if (Math.random() > this.m_rate){
                        if (Math.random() < nn1.fitness / (nn1.fitness+nn2.fitness)) {
                          child.biases[i][j] = nn1.biases[i][j]

                        } else {
                          child.biases[i][j] = nn2.biases[i][j]
                      }
                    }}}
        return child
      }
      createNewGeneration=()=>{
          let nextGen = []
          this.population.sort(function(a, b){return b.fitness - a.fitness});
          for (let i = 0; i < this.popCount; i++){
            if (Math.random() < Math.min(-0.5*Math.log(i/this.popCount),1)){
              const cloned = Object.assign({}, this.population[i]);
              nextGen.push(cloned);
            }
          }
          let fitnessSum = [0]
          let minFit = Math.min(...nextGen.map(function(o) { return o.fitness; }))
          let maxFit = Math.max(...nextGen.map(function(o) { return o.fitness; }))
          for (let j = 0; j < nextGen.length; j++){
              fitnessSum.push(fitnessSum[j]+(nextGen[j].fitness-minFit)**4)
          }

          while(nextGen.length < this.popCount){
            const r1 = Math.random()*fitnessSum[fitnessSum.length-1]
            const r2 = Math.random()*fitnessSum[fitnessSum.length-1]
            const i1 = this.bisect_left(fitnessSum, r1)
            const i2 = this.bisect_left(fitnessSum, r2)
            nextGen.push( this.createChild(nextGen[i1], nextGen[i2]))
          }
          this.population = nextGen
        }

        bisect_left = ( a , x , lo = 0 , hi = a.length ) =>{

          while ( lo < hi ) {

              const mid = ( lo + hi ) / 2 | 0 ;

              if ( x > a[mid] ) lo = mid + 1 ;

              else hi = mid ;

          }

          return lo ;

      }


      bisect_right = ( a , x , lo = 0 , hi = a.length ) =>{

    while ( lo < hi ) {

        const mid = ( lo + hi ) / 2 | 0 ;

        if ( x < a[mid] ) hi = mid ;

        else lo = mid + 1 ;

    }

    return lo ;

}

}
