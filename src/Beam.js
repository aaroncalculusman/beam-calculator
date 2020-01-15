
export default class Beam {
  constructor () {
    this._length = null
    this._moment = null
    this._modulus = null
    this.pointLoads = [] // Array of discrete loads. (Note the absence of the _ in this assignment: this invokes the setter which creates a Proxy; see the setter below for more details.)
    this._contLoad = () => 0 // A function that gives the load on the beam as a function of distance from the left anchor
    this._anchor = ['simple', 'simple'] // or 'fixed' or 'free'
    this._isSolved = false
    this.pins = [] // pins and rollers are the same for this thing
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
    if (typeof newMoment === 'function') {
      throw new TypeError('Support for moment as a function is not available yet but is planned for the future.')
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

  get pins () {
    return this._pinsProxy
  }

  set pins (newPins) {
    if (!Array.isArray(newPins)) {
      throw new TypeError('pins must be an array')
    }
    // Check to make sure each item in newPins is acceptable
    for (let pin of newPins) {
      if (!this._isValidPin(pin)) {
        throw new TypeError('Each item of pins must be an object of type: { x: number }')
      }
    }
    this._pins = newPins

    // Proxy _pins so we're notified if the user modifies it
    const arrayHandler = {
      set: (target, property, value) => {
        // console.log(`Setting property ${property} of ${JSON.stringify(target)} to ${JSON.stringify(value)}`)
        if (/^\d+$/.test(property)) {
          // Array indexing
          if (!this._isValidPin(value)) {
            throw new TypeError('A pin must be an object of type: { x: number }')
          }
          Object.freeze(value)
        }
        target[property] = value
        this._isSolved = false
        return Reflect.set(target, property, value)
      }
    }
    this._pinsProxy = new Proxy(this._pins, arrayHandler)

    this._isSolved = false
  }

  /**
   * Tests whether the given object is a valid pin.
   * @param {Object} obj The pin to test for validity
   */
  _isValidPin (obj) {
    return obj && typeof obj.x === 'number'
  }

  /**
   * Adds a pin to the beam, and returns the pin that was added.
   * @param {number} x The distance from the left end of the beam to add the point load.
   * @returns {Object} The new pin that was added.
   */
  addPin (x, w) {
    let newPin
    if (typeof x === 'object') {
      newPin = x
    } else if (typeof x === 'number') {
      newPin = { x }
    }

    if (!this._isValidPin(newPin)) {
      throw new TypeError('You must supply a number, or an object containing a single property x which is a number')
    }

    Object.freeze(newPin)
    this._pins.push(newPin)
    this._isSolved = false
    return newPin
  }

  /**
   * Removes a pin that was added using addPin.
   * @param {Object} pin
   */
  removePin (pin) {
    const i = this._pins.indexOf(pin)
    if (i < 0) {
      // TODO: Should we return true/false indicating whether the pin was found, instead of throwing?
      throw new Error('The given pin was not found. (Pins are matched by reference, not value.)')
    }
    this._pins.splice(i, 1)
    this._isSolved = false
    return true
  }

  /**
   * Creates an array of evenly spaced points, plus two points for each point load, which are used to solve the beam deflection problem.
   * @param {number} numGridPts The number of evenly spaced intervals to create. The actual number of grid points is one more than this number (endpoints are included). Two additional grid points are also created for every point load.
   * @returns {Array} An array of grid points sorted by x-coordinate.
   */
  _createGrid (numGridPts) {
    if (typeof numGridPts !== 'number' || !(numGridPts > 0) || Math.round(numGridPts) !== numGridPts) {
      throw new TypeError('numGridPts must be a positive integer.')
    }

    // Create a grid of points
    const grid = []

    // Add evenly spaced points
    for (let i = 0; i <= numGridPts; i++) {
      grid[i] = {
        x: this._length * i / numGridPts
      }

      // grid[i] = { }
      // grid[i].x = this._length * i / numGridPts
    }

    // Add two grid points for each point load
    for (let ptLoad of this._pointLoads) {
      // NOTE: The conditional statements in this block make exact comparisons between floating-point numbers. This is intended.

      // Check for ptLoads that exist at an existing grid location
      let dupeGridPointIndex = grid.findIndex(pt => pt.x === ptLoad.x && !pt.isPointLoad)
      if (dupeGridPointIndex >= 0) {
        // Remove the existing grid point
        grid.splice(dupeGridPointIndex, 1)
      }

      // Check for duplicate ptLoads
      let dupePointLoadIndex1 = grid.findIndex(pt => pt.x === ptLoad.x && pt.isPointLoad && pt.relationToPointLoad === -1)
      let dupePointLoadIndex2 = grid.findIndex(pt => pt.x === ptLoad.x && pt.isPointLoad && pt.relationToPointLoad === 1)
      if (dupePointLoadIndex1 >= 0 && dupePointLoadIndex2 >= 0) {
        // Instead of adding new grid points, just add this point load to the existing ones
        grid[dupePointLoadIndex1].pointLoad += ptLoad.w
        grid[dupePointLoadIndex2].pointLoad += ptLoad.w
      } else {
        // Add two new grid points for this point load
        grid.push({
          x: ptLoad.x,
          pointLoad: ptLoad.w,
          isPointLoad: true,
          relationToPointLoad: -1
        })
        grid.push({
          x: ptLoad.x,
          pointLoad: ptLoad.w,
          isPointLoad: true,
          relationToPointLoad: 1
        })
      }
    }

    // TODO: Add pin locations to the grid

    // Sort grid first by x-coordinate, then by relationToPointLoad
    // TODO: Use binary search insertion in the for..of loop above to improve performance
    grid.sort((a, b) => {
      if (a.x > b.x) return 1
      else if (a.x < b.x) return -1
      else if (a.relationToPointLoad > b.relationToPointLoad) return 1
      else if (a.relationToPointLoad < b.relationToPointLoad) return -1
      else return 0
    })

    return grid
  }

  solve (numGridPts) {
    // TODO: For any anchors which are "simple", add a pin to that location before solving (but don't change this.pins, we want that to stay the same)

    let grid = this._createGrid(numGridPts)

    // Up to this point we have collected downward forces on the beam including point loads and constant or distributed loads.  We have ordered those forces and made a grid representing distances and magnitudes
    // Here are the next steps:
    // 1-Determine the reaction forces at A (left side) and B (right side) of the beam.  Here is an example beam
    //         q/x                     2q
    //     _______________              |
    //     |  |  |  |  |  |             |
    //    _v__v__v__v__v__v_____________v______________
    //   ^                                             ^
    //   A                    x--->                    B
    // We take the sum of the moments about A to find the reaction force at B and then subtract the reaction force B from the sum of all of the forces to determine A
    // Shear has units of force lbf or N
    // 2-Bending moment has units of lbf*ft or N*m is the integral of the shear with respect to X.  We calculate it using Simpson's rule

    // Given: Applied weight w(x) of all point loads, pins, fixed supports, and continuous loads
    // Step 1: V(x) = - int{ w(x) dx } + C1
    // Step 2: M(x) = int{ V(x) dx } + C1*x + C2
    // Step 3: th(x) = int{ M(x) / EI dx } + C1*x^2/2 + C2*x + c3
    // Step 4: y(x) = int{ th(x) dx } + C1*x^3/6 + C2*x^2/2 + C3*x + C4

    // Unknowns:
    // Add 4 unknowns from the constants of integration: C1, C2, C3, C4
    // Add 2 unknowns for each fixed end (applied force and applied moment)
    // Add 1 unknown for each pin (applied force)

    // Equations:
    // Add 2 equations for each end of the beam (4 total): V = 0, M = 0
    // Add 2 equations for each end that is fixed: th = 0, y = 0
    // Add 1 equation for every pin: y = 0

    // Because V(0) = 0 and M(0) = 0 for every beam (non-zero boundary conditions are assumed to be unknown applied forces and moments), we can eliminate two unknowns immediately: C1 = 0 and C2 = 0.

    // Examples:
    // Simply supported beam (V is zero in this case because there is a discontinuity at each endpoint, the zero value is at the outside of the discontinuity)
    //
    //       |
    //  _____V______
    //  ^          ^
    //  p1         p2
    //
    // Unknowns (4): C3, C4, p1, p2
    // Equations (4): V(L) = 0, M(L) = 0, y(0) = 0, y(L) = 0
    // DOF: 0

    // Fixed-free beam
    //
    //           |
    //   //|_____V______
    //   //|
    //   p1, m1
    //
    // Unknowns (4): C3, C4, p1, m1
    // Equations (4): th(0) = 0, y(0) = 0, V(L) = 0, M(L) = 0
    // DOF: 0

    // Fixed-pin beam
    //
    //           |
    //   //|_____V______
    //   //|           ^
    //   p1, m1        p2
    //
    // Unknowns (5): C3, C4, p1, m1, p2
    // Equations (5): th(0) = 0, y(0) = 0, V(L) = 0, M(L) = 0, y(L) = 0
    // DOF: 0

    // Fixed-fixed beam
    //
    //           |
    //   //|_____V______|//
    //   //|            |//
    //   p1, m1       p2, m2
    //
    // Unknowns (6): C3, C4, p1, m1, p2, m2
    // Equations (6): th(0) = 0, y(0) = 0, V(L) = 0, M(L) = 0, th(L) = 0, y(L) = 0
    // DOF: 0

    // Three pins in middle of beam
    //   ___________
    //     ^  ^  ^
    //     p1 p2 p3
    //
    // Unknowns (5): C3, C4, p1, p2, p3
    // Equations (5): V(L) = 0, M(L) = 0, y(1) = 0, y(2) = 0, y(3) = 0
    // DOF: 0

    // Unsupported beam
    //   ___________
    //
    // Unknowns (2): C3, C4
    // Equations (2): V(L) = 0, M(L) = 0
    // DOF: 0
    // Will result in singular matrix when solving

    // Beam with single pin
    //   ___________
    //     ^
    //     p1
    //
    // Unknowns (3): C3, C4, p1
    // Equations (3): V(L) = 0, M(L) = 0, y(1) = 0
    // DOF: 0
    // Will result in singular matrix when solving

    // Unbalanced beam
    //
    //           |
    //   ________V__
    //    ^   ^
    //    p1  p2
    //
    // Unknowns (4): C3, C4, p1, p2
    // Equations (4): V(L) = 0, M(L) = 0, y(1) = 0, y(2) = 0
    // DOF: 0
    // Will solve just fine with one of the pins having a negative load (but it's a pin, not a roller, so it's okay)

    // Do integrations in one pass of the for loop, so that we can use intermediate values without having to store them between loops.
    grid[0].vbar = 0
    grid[0].mbar = 0
    grid[0].thetabar = 0
    grid[0].ybar = 0
    for (let i = 0; i < grid.length - 1; i++) {
      const a = grid[i].x
      const b = grid[i + 1].x

      if (grid[i].isPointLoad && grid[i].relationToPointLoad === -1) {
        // This is a point load.
        // Add the contributions from the point load to Vbar. The other variables, I think, will remain unchanged.

        grid[i + 1].vbar = grid[i].vbar + grid[i].pointLoad
        grid[i + 1].mbar = grid[i].mbar
        grid[i + 1].thetabar = grid[i].thetabar
        grid[i + 1].ybar = grid[i].ybar
      } else if (a !== b) {
        // Further subdivide this grid point into 4 sections. The final two integrations will halve the number of points, which will bring us back to the original grid.
        // Intermediate points:
        const ab = (a + b) / 2
        const aab = (a + ab) / 2
        const abb = (ab + b) / 2

        // Evaluate w at intemediate points
        const fa = this.contLoad(a) // TODO: Could reuse previous loop's fb
        const faab = this.contLoad(aab)
        const fab = this.contLoad(ab)
        const fabb = this.contLoad(abb)
        const fb = this.contLoad(b)

        // Calculate Vbar using trapezoid rule
        const vbara = grid[i].vbar
        const vbaraab = vbara + (faab + fa) / 2 * (aab - a)
        const vbarab = vbaraab + (fab + faab) / 2 * (ab - aab)
        const vbarabb = vbarab + (fabb + fab) / 2 * (abb - ab)
        const vbarb = vbarabb + (fb + fabb) / 2 * (b - abb)

        // Calculate mbar using trapezoid rule
        const mbara = grid[i].mbar
        const mbaraab = mbara + (vbaraab + vbara) / 2 * (aab - a)
        const mbarab = mbaraab + (vbarab + vbaraab) / 2 * (ab - aab)
        const mbarabb = mbarab + (vbarabb + vbarab) / 2 * (abb - ab)
        const mbarb = mbarabb + (vbarb + vbarabb) / 2 * (b - abb)

        // Calculate thetabar using Simpson's rule
        const thetabara = grid[i].thetabar
        const thetabarab = thetabara + (mbara + 4 * mbaraab + mbarab) / 6 * (ab - a)
        const thetabarb = thetabarab + (mbarab + 4 * mbarabb + mbarb) / 6 * (b - ab)

        // Try using trapezoid rule instead... what do we get? We get pretty close to the right answer. Our simpson's rule must be off...
        // const thetabara = grid[i].thetabar
        // const thetabaraab = thetabara + (mbaraab + mbara) / 2 * (aab - a)
        // const thetabarab = thetabaraab + (mbarab + mbaraab) / 2 * (ab - aab)
        // const thetabarabb = thetabarab + (mbarabb + mbarab) / 2 * (abb - ab)
        // const thetabarb = thetabarabb + (mbarb + mbarabb) / 2 * (b - abb)

        // Calculate ybar using Simpson's rule
        const ybara = grid[i].ybar
        const ybarb = ybara + (thetabara + 4 * thetabarab + thetabarb) / 6 * (b - a)

        // Store results in grid
        grid[i + 1].vbar = vbarb
        grid[i + 1].mbar = mbarb
        grid[i + 1].thetabar = thetabarb
        grid[i + 1].ybar = ybarb
      } else if (grid[i].isAnchor && grid[i].relationToAnchor === -1) {
        // This is not a point load and not a normal grid interval, it must be an anchor. The *bar variables do not include contributions from anchors.
        grid[i + 1].vbar = grid[i].vbar
        grid[i + 1].mbar = grid[i].mbar
        grid[i + 1].thetabar = grid[i].thetabar
        grid[i + 1].ybar = grid[i].ybar
      } else {
        throw new Error('Unsupported type of grid point.')
      }
    }

    // The numerical integration is complete. The *bar variables are calculated at each grid point.

    // TODO: Decide what exactly solve will return, and how exactly this Beam will be changed when it has solved
    // For now, just return the grid, which we can use to check to see if everything's working right
    return grid
  }
}
