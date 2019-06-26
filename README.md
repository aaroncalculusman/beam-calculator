# beam-calculator

## Install

```
npm install beam-calculator
```

## Use

```js
import Beam from 'Beam'

// Create a new beam
let b = new Beam()

// Set units 'SI' or 'US'
b.units = 'SI'

// Set length of beam
b.length = 20 // SI = meters, US = inch

// Set a constant second moment of area
b.moment = 100 // SI = meter^4, US = inch^4

// Alternatively, set a variable second moment of
// area (tapered beam) by assigning a function to 
// moment. The function accepts a value which is the
// distance from the left end of the beam, and 
// returns the second moment of area at that point.
b.moment = Function

// Set the beam's Young's modulus
b.modulus = 40 // SI = Pa, US = psi

// or, set the material to use the built-in Young's modulus value
b.material = 'Al6061'

// Use this to list the available materials
Beam.listMaterials()

// Set the types of supports: simple (pin), fixed, or free
b.anchorLeft = 'fixed'
b.anchorRight = 'free'

// Add point loads
b.addPointLoad({ x: 4, w: 1000 }) // x = distance from left end of beam, w = force (SI = N, US = lbf)
// or
b.pointLoads.push({ x: 4, w: 1000 })

// In addition to point loads, you can also
// add a continuous load using a function.
// The function accepts a value which is the
// distance from the left end of the beam, and 
// returns the force per unit length at that
// point.
b.contLoad = Function

// Get results
b.getShearForce(10) // SI = N, US = lbf
b.getBendingMoment(10) // SI = N m, US = lbf in
b.getSlope(10) // SI = m/m, US = in/in
b.getDeflection(10) // SI = m, US = in

```
