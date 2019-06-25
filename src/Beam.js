
export class Beam {
  
  constructor() {
    this._length = null
    this._moment = null
    this._pointLoads = [] // Array of discrete loads 
    this._contLoad = null // A function that gives the load on the beam as a function of distance from the left anchor
    this._anchor = ['simple', 'simple'] // or 'fixed' or 'free'
    this._isSolved = false
    
    // Proxy _pointLoads so we're notified if the user modifies it
    const arrayHandler = {
      set: (obj, prop, value) => {
        console.log(obj, prop, value)
        obj[prop] = value
        this._isSolved = false
      }
    }
    this._pointLoadsProxy = new Proxy(this._pointLoads, arrayHandler) 

  }

  get length() {
    return this._length
  }

  set length(newLength) {
    if (typeof newLength !== 'number') {
      throw new TypeError('length must be a number')
    }
    this._length = newLength
    this._isSolved = false
  }

  get moment() {
    return this._moment
  }

  set moment(newMoment) {
    if (typeof newMoment !== 'number' && typeof newMoment !== 'function') {
      throw new TypeError('moment must be a number, or a function that returns the moment as a function of the distance from the left end of the beam')
    }
    this._moment = newMoment
    this._isSolved = false
  }

  get contLoad() {
    return this._contLoad
  }

  set contLoad(newContLoad) {
    if (typeof newMoment !== 'function') {
      throw new TypeError('contLoad must be a function that returns the load density as a function of the distance from the left end of the beam')
    }
    this._contLoad = newContLoad
    this._isSolved = false
  }

  get anchorLeft() {
    return this._anchor[0]
  }

  set anchorLeft(newAnchorLeft) {
    const allowed = ['simple', 'fixed', 'free']
    if (!allowed.includes(newAnchorLeft)) {
      throw new TypeError(`anchorLeft must be one of ${allowed.join(', ')}`)
    }
    this._anchor[0] = newAnchorLeft
    this._isSolved = false
  }

  get anchorRight() {
    return this._anchor[1]
  }

  set anchorRight(newAnchorRight) {
    const allowed = ['simple', 'fixed', 'free']
    if (!allowed.includes(newAnchorRight)) {
      throw new TypeError(`anchorRight must be one of ${allowed.join(', ')}`)
    }
    this._anchor[1] = newAnchorRight
    this._isSolved = false
  }

  get pointLoads() {
    return this._pointLoadsProxy
  }

  set pointLoads(newPointLoads) {
    if (!Array.isArray(newPointLoads)) {
      throw new TypeError('pointLoads must be an array')
    }
    // Check to make sure each item in newPointLoads is acceptable
    for (let ptLoad of newPointLoads) {
      if (!ptLoad || typeof ptLoad.x !== 'number' || typeof ptLoad.w !== 'number') {
        throw new TypeError('Each item of pointLoads must be an object of type: { x: number, w: number }')
      }
    }
    this._pointLoads = newPointLoads
    this._isSolved = false
  }

  /**
   * Adds a point load to the beam, and returns the new point load that was added.
   * @param {number} x The distance from the left end of the beam to add the point load.
   * @param {number} w The downward force of the point load.
   * @returns {Object} The new point load that was added. 
   */
  addPointLoad(x, w) {
    if (typeof x !== 'number') {
      throw new TypeError('x must be a number')
    }
    if (typeof w !== 'number') {
      throw new TypeError('w must be a number')
    }
    const newPointLoad = { x, w }
    this._pointLoads.push(newPointLoad)
    this._isSolved = false
    return newPointLoad
  }

  /**
   * Removes a point load that was added using addPointLoad.
   * @param {Object} pointLoad 
   */
  removePointLoad(pointLoad) {
    const i = this._pointLoads.indexOf(pointLoad)
    if (i < 0) {
      // TODO: Should we return true/false indicating whether the point load was found, instead of throwing?
      throw new Error('The given point load was not found. (Point loads are matched by reference, not value.)')
    }
    this._pointLoads.splice(i, 1)
    this._isSolved = false
    return true
  }


}