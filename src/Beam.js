
export default class Beam {
  constructor () {
    this._length = null
    this._moment = null
    this._modulus = null
    this.pointLoads = [] // Array of discrete loads. (Note the absence of the _ in this assignment: this invokes the setter which creates a Proxy; see the setter below for more details.)
    this._contLoad = null // A function that gives the load on the beam as a function of distance from the left anchor
    this._anchor = ['simple', 'simple'] // or 'fixed' or 'free'
    this._isSolved = false
  }

  get length () {
    return this._length
  }

  set length (newLength) {
    if (typeof newLength !== 'number' || !(newLength > 0)) {
      throw new TypeError('length must be a positive number')
    }
    this._length = newLength
    this._isSolved = false
  }

  get moment () {
    return this._moment
  }

  set moment (newMoment) {
    if (newMoment < 0 || (typeof newMoment !== 'number' && typeof newMoment !== 'function')) {
      throw new TypeError('moment must be a positive number or a function that returns the moment as a function of the distance from the left end of the beam')
    }
    this._moment = newMoment
    this._isSolved = false
  }

  get modulus () {
    return this._modulus
  }

  set modulus (newModulus) {
    if (newModulus < 0 || typeof newModulus !== 'number') {
      throw new TypeError('modulus must be a positive number')
    }
    this._modulus = newModulus
    this._isSolved = false
  }

  get contLoad () {
    return this._contLoad
  }

  set contLoad (newContLoad) {
    if (typeof newContLoad !== 'function') {
      throw new TypeError('contLoad must be a function that returns the load density as a function of the distance from the left end of the beam')
    }
    this._contLoad = newContLoad
    this._isSolved = false
  }

  get anchorLeft () {
    return this._anchor[0]
  }

  set anchorLeft (newAnchorLeft) {
    const allowed = ['simple', 'fixed', 'free']
    if (!allowed.includes(newAnchorLeft)) {
      throw new TypeError(`anchorLeft must be one of ${allowed.join(', ')}`)
    }
    this._anchor[0] = newAnchorLeft
    this._isSolved = false
  }

  get anchorRight () {
    return this._anchor[1]
  }

  set anchorRight (newAnchorRight) {
    const allowed = ['simple', 'fixed', 'free']
    if (!allowed.includes(newAnchorRight)) {
      throw new TypeError(`anchorRight must be one of ${allowed.join(', ')}`)
    }
    this._anchor[1] = newAnchorRight
    this._isSolved = false
  }

  get pointLoads () {
    return this._pointLoadsProxy
  }

  set pointLoads (newPointLoads) {
    if (!Array.isArray(newPointLoads)) {
      throw new TypeError('pointLoads must be an array')
    }
    // Check to make sure each item in newPointLoads is acceptable
    for (let ptLoad of newPointLoads) {
      if (!this._isValidPointLoad(ptLoad)) {
        throw new TypeError('Each item of pointLoads must be an object of type: { x: number, w: number }')
      }
    }
    this._pointLoads = newPointLoads

    // Proxy _pointLoads so we're notified if the user modifies it
    const arrayHandler = {
      set: (target, property, value) => {
        // console.log(`Setting property ${property} of ${JSON.stringify(target)} to ${JSON.stringify(value)}`)
        if (/^\d+$/.test(property)) {
          // Array indexing
          if (!this._isValidPointLoad(value)) {
            throw new TypeError('A point load must be an object of type: { x: number, w: number }')
          }
          Object.freeze(value)
        }
        target[property] = value
        this._isSolved = false
        return Reflect.set(target, property, value)
      }
    }
    this._pointLoadsProxy = new Proxy(this._pointLoads, arrayHandler)

    this._isSolved = false
  }

  /**
   * Tests whether the given object is a valid point load.
   * @param {Object} obj The point load to test for validity
   */
  _isValidPointLoad (obj) {
    return obj && typeof obj.x === 'number' && typeof obj.w === 'number'
  }

  /**
   * Adds a point load to the beam, and returns the new point load that was added.
   * @param {number} x The distance from the left end of the beam to add the point load.
   * @param {number} w The downward force of the point load.
   * @returns {Object} The new point load that was added.
   */
  addPointLoad (x, w) {
    let newPointLoad
    if (typeof x === 'object') {
      newPointLoad = x
    } else if (typeof x === 'number' && typeof w === 'number') {
      newPointLoad = { x, w }
    }

    if (!this._isValidPointLoad(newPointLoad)) {
      throw new TypeError('You must supply two numbers, or an object containing properties x and w which are both numbers')
    }

    Object.freeze(newPointLoad)
    this._pointLoads.push(newPointLoad)
    this._isSolved = false
    return newPointLoad
  }

  /**
   * Removes a point load that was added using addPointLoad.
   * @param {Object} pointLoad
   */
  removePointLoad (pointLoad) {
    const i = this._pointLoads.indexOf(pointLoad)
    if (i < 0) {
      // TODO: Should we return true/false indicating whether the point load was found, instead of throwing?
      throw new Error('The given point load was not found. (Point loads are matched by reference, not value.)')
    }
    this._pointLoads.splice(i, 1)
    this._isSolved = false
    return true
  }

  solve () {
    // Create a grid of points
    const gridx = []

    // Add evenly spaced points
    const numGridPts = 5
    for (let i = 0; i <= numGridPts; i++) {
      gridx[i] = this._length * i / numGridPts
    }

    // Add points where point loads are located
    for (let ptLoad of this._pointLoads) {
      gridx.push(ptLoad.x)
    }

    // Sort gridx
    gridx.sort((a, b) => {
      if (a > b) return 1
      else if (a < b) return -1
      else return 0
    })
//Up to this point we have collected downward forces on the beam including point loads and constant or distributed loads.  We have ordered those forces and made a grid representing distances and magnitudes
//Here are the next steps:
//1-Determine the reaction forces at A (left side) and B (right side) of the beam.  Here is an example beam
//        q/x                     2q
//    _______________              |
//    |  |  |  |  |  |             |
//   _v__v__v__v__v__v_____________v______________
//  ^                                             ^
//  A                    x--->                    B
//We take the sum of the moments about A to find the reaction force at B and then subtract the reaction force B from the sum of all of the forces to determine A
//Shear has units of force lbf or N
//2-Bending moment has units of lbf*ft or N*m is the integral of the shear with respect to X.  We calculate it using Simpson's rule
//
//
    // Calculate shear
    const shear = []
    for (let i = 0; i < gridx.length - 1; i++) {
      const a = gridx[i]
      const b = gridx[i + 1]
      const fa = this.contLoad(a) //reaction force at point A (left side) based on loads
      const fa2 = this.contLoad((a + b) / 2)
      const fb = this.contLoad(b)

      console.log(gridx)
    }
  }
}
