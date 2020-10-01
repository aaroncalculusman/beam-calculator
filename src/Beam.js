
export default class Beam {
  constructor () {
    this._length = null
    this._moment = null
    this._modulus = null
    this.pointLoads = [] // Array of discrete loads. (Note the absence of the _ in this assignment: this invokes the setter which creates a Proxy; see the setter below for more details.)
    this._contLoad = () => 0 // A function that gives the load on the beam as a function of distance from the left anchor
    this._anchor = ['free', 'free'] // or 'fixed'
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
    const allowed = ['free', 'fixed']
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
    const allowed = ['free', 'fixed']
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
        x: this._length * (i / numGridPts) // parens ensure that the final x will be exactly _length
      }

      // grid[i] = { }
      // grid[i].x = this._length * i / numGridPts
    }

    // Add two grid points for each point load
    for (let ptLoad of this._pointLoads) {
      // NOTE: The conditional statements in this block make exact comparisons between floating-point numbers. This is intended.

      // Check for ptLoads that exist at an existing grid location
      let dupeGridPointIndex = grid.findIndex(pt => pt.x === ptLoad.x && !pt.isPointLoad && !pt.isPin)
      if (dupeGridPointIndex >= 0) {
        // Remove the existing grid point
        grid.splice(dupeGridPointIndex, 1)
      }

      // Check for duplicate ptLoads
      let dupePointLoadIndex1 = grid.findIndex(pt => pt.x === ptLoad.x && pt.isPointLoad && pt.relationToFeature === -1)
      let dupePointLoadIndex2 = grid.findIndex(pt => pt.x === ptLoad.x && pt.isPointLoad && pt.relationToFeature === 1)
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
          relationToFeature: -1
        })
        grid.push({
          x: ptLoad.x,
          pointLoad: ptLoad.w,
          isPointLoad: true,
          relationToFeature: 1
        })
      }
    }

    // Add two grid points for each pin
    for (let pin of this._pins) {
      // Check for duplicate pin at this location
      if (grid.some(pt => pt.x === pin.x && pt.isPin)) {
        // No need to add a second pin at the same point
        continue
      }

      // Check for pin at existing grid point (but not a point load)
      let dupeGridPointIndex = grid.findIndex(pt => pt.x === pin.x && !pt.isPointLoad && !pt.isPin)
      if (dupeGridPointIndex >= 0) {
        // Remove the existing grid point
        grid.splice(dupeGridPointIndex, 1)
      }

      // Check for point load at same location
      let dupePointLoadIndex1 = grid.findIndex(pt => pt.x === pin.x && pt.isPointLoad && pt.relationToFeature === -1)
      let dupePointLoadIndex2 = grid.findIndex(pt => pt.x === pin.x && pt.isPointLoad && pt.relationToFeature === 1)
      if (dupePointLoadIndex1 >= 0 && dupePointLoadIndex2 >= 0) {
        // Instead of adding new grid points, just mark this point as a pin
        grid[dupePointLoadIndex1].isPin = true
        grid[dupePointLoadIndex2].isPin = true
      } else {
        // Add two new grid points for this pin
        grid.push({
          x: pin.x,
          isPin: true,
          relationToFeature: -1
        })
        grid.push({
          x: pin.x,
          isPin: true,
          relationToFeature: 1
        })
      }
    }

    // If anchors are fixed, add a second grid point since there will be a discontinuity at the endpoints
    if (this.anchorLeft === 'fixed') {
      let existingGridPt = grid.findIndex(pt => pt.x === 0 && !pt.isPointLoad && !pt.isPin)
      if (existingGridPt >= 0) {
        // Add second grid point
        grid.splice(existingGridPt, 1, {
          x: 0,
          isFixedAnchor: true,
          relationToFeature: -1
        }, {
          x: 0,
          isFixedAnchor: true,
          relationToFeature: 1
        })
      }
    }

    if (this.anchorRight === 'fixed') {
      let existingGridPt = grid.findIndex(pt => pt.x === this._length && !pt.isPointLoad && !pt.isPin)
      if (existingGridPt >= 0) {
        // Add second grid point
        grid.splice(existingGridPt, 1, {
          x: this._length,
          isFixedAnchor: true,
          relationToFeature: -1
        }, {
          x: this._length,
          isFixedAnchor: true,
          relationToFeature: 1
        })
      }
    }

    // Sort grid first by x-coordinate, then by relationToPointLoad
    // TODO: Use binary search insertion in the for..of loop above to improve performance
    grid.sort((a, b) => {
      if (a.x > b.x) return 1
      else if (a.x < b.x) return -1
      else if (a.relationToPointLoad > b.relationToPointLoad) return 1
      else if (a.relationToPointLoad < b.relationToPointLoad) return -1
      else if (a.relationToPin > b.relationToPin) return 1
      else if (a.relationToPin < b.relationToPin) return -1

      else return 0
    })

    return grid
  }

  /** Returns the grid point(s) that whose x-coordinate is equal to x. If x is at a pin, there could be multiple grid points matching x. */
  _findGridPt (x, grid) {
    // TODO: Binary search, and be rid of this slow method
    let ret = []
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].x === x) {
        ret.push(grid[i])
      }
    }
    return ret
  }

  solve (numGridPts) {
    let grid = this._createGrid(numGridPts)

    let EI = this.moment * this.modulus

    if (EI <= 0) {
      if (this.moment <= 0) {
        throw new Error('Cannot solve beam: moment <= 0')
      }
      if (this.modulus <= 0) {
        throw new Error('Cannot solve beam: modulus <= 0')
      }
    }

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

      if (grid[i].isPointLoad && grid[i].relationToFeature === -1) {
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

        // Calculate ybar using Simpson's rule
        const ybara = grid[i].ybar
        const ybarb = ybara + (thetabara + 4 * thetabarab + thetabarb) / 6 * (b - a)

        // Store results in grid
        grid[i + 1].vbar = vbarb
        grid[i + 1].mbar = mbarb
        grid[i + 1].thetabar = thetabarb
        grid[i + 1].ybar = ybarb
      } else if (grid[i].isPin && grid[i].relationToFeature === -1) {
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

    // We need to decide where in the matrix each equation and unknown will live.
    // Generally, we'll go from left to right. This will keep the matrix mostly diagonal.

    // The variables and equations will be indexed in this order:
    // if fixed anchor on left: add two variables m0 and p0; add equations y(0) = 0 and theta(0) = 0
    // for each pin: add variable p_i; add equation y(i) = 0
    // if fixed anchor on right: add variables mL and pL; add equations y(L) = 0 and theta(L) = 0
    // add variables c3 and c4; add equation m(L) = 0, v(L) = 0

    // If fixed anchor on left, first two variables will be m0 and p0.
    // First two equations will be:
    // y(0) = 0, which becomes c_4 = 0
    // theta(0) = 0, which becomes c_3 = 0

    // For each pin: add variable p_i
    // Add equation y(x_i) = 0
    // Which becomes:
    // ybar(x_i) + 1/EI * (-p0 x_i^3/6 - sum(j<i, p_j (x_i - x_j)^3/6) + m0 x_i^2/2) + c_3 x_i + c_4 = 0

    // If fixed anchor on right, next two variables will be mL and pL.
    // Next two equations will be: y(L) = 0, which becomes:
    // ybar(L) + 1/EI (-p0 L^3/6 - sum(j, p_j (L - x_j)^3/6) + m0 L^2/2) + c_3 L + c_4 = 0
    // and theta(L) = 0, which becomes:
    // thetabar(L) + 1/EI (-p0 L^2/2 - sum(j, p_j (L - x_j)^2/2) + m0 L) + c_3 = 0

    // The final two equations are:
    // m(L) = 0, which becomes:
    // mbar(L) - p0 L - sum(j, p_j (L - x_j) + m0 + mL = 0
    // and v(L) = 0, which becomes:
    // vbar(L) - p0 - sum(j, p_i) - pL = 0

    // List of variables:
    // m0  (if left fixed anchor)
    // p0  (if left fixed anchor)
    // p_i     (for each pin)
    // mL (if right fixed anchor)
    // pL (if right fixed anchor)
    // c3
    // c4

    // Equations, written again in matrix form with terms in correct order
    // m0  p0  ...p_i  mL  pL  c_3  c_4   constant
    //                              c_4 = 0               If fixed anchor on left
    //                         c_3      = 0               If fixed anchor on left
    //
    // For each pin i:
    // m0 x_i^2/2EI - p0 x_i^3/6EI - sum(j < i, p_j (x_i - x_j) ^ 3 / 6EI) + c_3 x_i + c_4 = -ybar(x_i)

    // Spelling it out:
    // For pin p_1 located at x_1, y(x_1) = 0, or:
    // m0 x_1^2/2EI - p0 x_1^3/6EI + c_3 x_1 + c_4 = -ybar(x_1)
    // For pin p_2 located at x_2, y(x_2) = 0, or:
    // m0 x_2^2/2EI - p0 x_2^3/6EI - p_1 (x_2 - x_1) ^ 3 / 6EI + c_3 x_2 + c_4 = -ybar(x_2)
    // For pin p_3 located at x_3, y(x_3) = 0, or:
    // m0 x_3^2/2EI - p0 x_3^3/6EI - p_1 (x_3 - x_1) ^ 3 / 6EI - p_2 (x_3 - x_2) ^ 3 / 6EI + c_3 x_3 + c_4 = -ybar(x_3)
    // And so on. Written in matrix standard form, these become:

    // For pin 1:
    // m0 [x_1^2/2EI]  p0 [-x_1^3/6EI]  p_1 [0] p_2 [0] p_3[0] mL [0] pL [0] c_3 [x_1] c_4 [1] = -ybar(x_1)
    // For pin 2:
    // m0 [x_2^2/2EI]  p0 [-x_2^3/6EI]  p_1 [-(x_2-x_1)^3/6EI] p_2 [0] p_3[0] mL [0] pL [0] c_3 [x_2] c_4 [1] = -ybar(x_2)
    // For pin 3:
    // m0 [x_3^2/2EI]  p0 [-x_3^3/6EI]  p_1 [-(x_3-x_1)^3/6EI] p_2 [-(x_3-x_2)^3/6EI] p_3[0] mL [0] pL [0] c_3 [x_3] c_4 [1] = -ybar(x_3)

    // m(L) = 0:
    // m0 [1] p0 [-L] p_1 [-(L-x_1)] p_2 [-(L-x_2)] p_3 [-(L-x_3)] mL [1] pL [0] c_3 [0] c_4 [0] = -mbar(L)

    // v(L) = 0:
    // m0 [0] p0 [-1] p_1 [-1] p_2 [-1] p_3 [-1] mL [0] pL [-1] c_3 [0] c_4 [0] = -vbar(L)

    // Not as hard as I thought! Bookkeeping will be straightforward. Will have to make sure we take the values from the correct sides of the discontinuities, it that is a concern.

    // Matrix is predominantly lower diagonal, as a result of arranging things from left to right. You could almost solve it by straight Gauss-Jordan elimination.

    let A = []
    let b = []

    // List of variables:
    // m0  (if left fixed anchor)  0
    // p0  (if left fixed anchor)  1
    // p_i     (for each pin)      nLeftDofs + i (starting at i=0)
    // mL (if right fixed anchor)  nLeftDofs + nPinDofs
    // pL (if right fixed anchor)  nLeftDofs + nPinDofs + 1
    // c3                          nLeftDofs + nPinDofs + nRightDofs
    // c4                          nLeftDofs + nPinDofs + nRightDofs + 1

    let nLeftDofs = this.anchorLeft ? 2 : 0
    let nRightDofs = this.anchorRight ? 2 : 0
    let nPinDofs = this.pins.length
    let nDofs = nLeftDofs + nPinDofs + nRightDofs + 2

    // Column indices of each variable
    let m0Idx, p0Idx, pIdx, mLIdx, pLIdx, c3Idx, c4Idx

    // Row indices of each equation
    let eqY0Idx, eqTheta0Idx, eqYxIdx, eqYLIdx, eqThetaLIdx, eqMLIdx, eqVLIdx

    // Set column and row indices (by adjusting the indices here, we can rearrange the matrix without breaking anything else)
    if (this.anchorLeft) {
      m0Idx = 0
      p0Idx = 1
      eqY0Idx = 0
      eqTheta0Idx = 1
    }
    pIdx = nLeftDofs // + i, with i starting at 0 for the first pin
    eqYxIdx = nLeftDofs // + i, with i starting at 0 for the first pin
    if (this.anchorRight) {
      mLIdx = nLeftDofs + nPinDofs
      pLIdx = nLeftDofs + nPinDofs + 1
      eqYLIdx = nLeftDofs + nPinDofs
      eqThetaLIdx = nLeftDofs + nPinDofs + 1
    }
    c3Idx = nLeftDofs + nPinDofs + nRightDofs
    c4Idx = nLeftDofs + nPinDofs + nRightDofs + 1
    eqMLIdx = nLeftDofs + nPinDofs + nRightDofs
    eqVLIdx = nLeftDofs + nPinDofs + nRightDofs + 1

    // Initialize A and b to 0's
    for (let i = 0; i < nDofs; i++) {
      A[i] = []
      for (let j = 0; j < nDofs; j++) {
        A[i][j] = 0
      }
    }

    // Set coefficients of A and b
    if (this.anchorLeft) {
      // y(0) = 0, or c_4 = 0
      A[eqY0Idx][c4Idx] = 1
      b[eqY0Idx] = 0

      // theta(0) = 0, or c_3 = 0
      A[eqTheta0Idx][c3Idx] = 1
      b[eqTheta0Idx] = 0
    }
    for (let i = 0; i < this.pins.length; i++) {
      // y(x_i) = 0, or:
      // ybar(x_i) + 1/EI * (-p0 x_i^3/6 - sum(j<i, p_j (x_i - x_j)^3/6) + m0 x_i^2/2) + c_3 x_i + c_4 = 0

      // For the third pin, for example:
      // m0 [x_3^2/2EI]  p0 [-x_3^3/6EI]  p_1 [-(x_3-x_1)^3/6EI] p_2 [-(x_3-x_2)^3/6EI] p_3[0] mL [0] pL [0] c_3 [x_3] c_4 [1] = -ybar(x_3)
      let xI = this.pins[i].x
      A[eqYxIdx + i][m0Idx] = xI ** 2 / (2 * EI)
      A[eqYxIdx + i][p0Idx] = -(xI ** 3) / (6 * EI)
      for (let j = 0; j < i; j++) {
        let xJ = this.pins[j].x
        A[eqYxIdx + i][pIdx + j] = -((xI - xJ) ** 3) / (6 * EI)
      }
      A[eqYxIdx + i][c3Idx] = xI
      A[eqYxIdx + i][c4Idx] = 1
      b[eqYxIdx + i] = -this._findGridPt(xI)[0].ybar // ybar will be equal on both sides of the discontinuity, so both grid points will match
    }

    let L = this.length
    if (this.anchorRight) {
      // y(L) = 0
      // ybar(L) + 1/EI (-p0 L^3/6 - sum(j, p_j (L - x_j)^3/6) + m0 L^2/2) + c_3 L + c_4 = 0
      //  -p0 L^3/(6 EI) + sum(j, -p_j (L - x_j)^3/(6EI)) + m0 L^2/(2EI) + c_3 L + c_4 = -ybar(L)
      A[eqYLIdx][p0Idx] = -(L ** 3) / (6 * EI)
      for (let j = 0; j < this.pins.length; j++) {
        let xJ = this.pins[j].x
        A[eqYLIdx][pIdx + j] = -((L - xJ) ** 3) / (6 * EI)
      }
      A[eqYLIdx][m0Idx] = L ** 2 / (2 * EI)
      A[eqYLIdx][c3Idx] = L
      A[eqYLIdx][c4Idx] = 1
      b[eqYLIdx] = -grid[grid.length - 1].ybar // Final grid point

      // theta(L) = 0
      // -p0 L^2/(2EI) + sum(j, -p_j (L - x_j)^2/(2EI)) + m0 L / EI + c_3 = -thetabar(L)
      A[eqThetaLIdx][p0Idx] = -(L ** 2) / (2 * EI)
      for (let j = 0; j < this.pins.length; j++) {
        let xJ = this.pins[j].x
        A[eqThetaLIdx][pIdx + j] = -((L - xJ) ** 2) / (2 * EI)
      }
      A[eqThetaLIdx][m0Idx] = L / EI
      A[eqThetaLIdx][c3Idx] = 1
      b[eqThetaLIdx] = -grid[grid.length - 1].thetabar
    }

    // m(L) = 0
    // m0 [1] p0 [-L] p_1 [-(L-x_1)] p_2 [-(L-x_2)] p_3 [-(L-x_3)] mL [1] pL [0] c_3 [0] c_4 [0] = -mbar(L)
    A[eqMLIdx][m0Idx] = 1
    A[eqMLIdx][p0Idx] = -L
    for (let j = 0; j < this.pins.length; j++) {
      let xJ = this.pins[j].x
      A[eqMLIdx][pIdx + j] = -(L - xJ)
    }
    A[eqMLIdx][mLIdx] = 1
    b[eqMLIdx] = -grid[grid.length - 1].mbar // Final grid point, right side of discontinuity, if there is one (which I don't think can happen with mbar)

    // v(L) = 0:
    // m0 [0] p0 [-1] p_1 [-1] p_2 [-1] p_3 [-1] mL [0] pL [-1] c_3 [0] c_4 [0] = -vbar(L)
    A[eqVLIdx][p0Idx] = -1
    for (let j = 0; j < this.pins.length; j++) {
      A[eqVLIdx][pIdx + j] = -1
    }
    A[eqVLIdx][pLIdx] = -1
    b[eqVLIdx] = -grid[grid.length - 1].vbar // Final grid point. I think there could be a discontinuity here if there is a point load on the very end of the beam.

    // TODO: Decide what exactly solve will return, and how exactly this Beam will be changed when it has solved
    // For now, just return the grid, A, and b, which we can use to check to see if everything's working right

    return { grid, A, b }
  }
}
