import assert from 'assert'
import approx from './approx'

import Beam from '../src/Beam.js'

describe('beam', () => {
  describe('constructor', () => {
    it('should construct an empty beam', () => {
      const b = new Beam()
      assert.strictEqual(b._length, null)
      assert.strictEqual(b._moment, null)
      assert.strictEqual(b._modulus, null)
      assert.deepStrictEqual(b._pointLoads, [])
      assert.strictEqual(b.contLoad(3.14), 0)
      assert.deepStrictEqual(b._anchor, ['free', 'free'])
      assert.strictEqual(b._isSolved, false)
    })

    it('should create a proxy for _pointLoads', () => {
      const b = new Beam()
      assert(b._pointLoadsProxy instanceof Array) // Not instanceof Proxy, as that should be totally transparent
    })

    it('should throw if called without "new" keyword', () => {
      assert.throws(() => Beam(), /Class constructor Beam cannot be invoked without 'new'/)
    })
  })

  describe('length', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.length = 5
      assert.strictEqual(b.length, 5)
    })

    it('should throw if given the wrong type or a negative number', () => {
      const b = new Beam()
      assert.throws(() => { b.length = 'five' }, /TypeError: length must be a positive number/)
      assert.throws(() => { b.length = -5 }, /TypeError: length must be a positive number/)
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.length = 5
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('moment', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.moment = 5
      assert.strictEqual(b.moment, 5)
    })

    it.skip('should support functions', () => {
      const b = new Beam()
      b.moment = x => x * x
      assert.strictEqual(b.moment(10), 100)
    })

    it('should throw if given the wrong type', () => {
      const b = new Beam()
      assert.throws(() => { b.moment = 'five' }, /TypeError: moment must be/)
      assert.throws(() => { b.moment = -5 }, /TypeError: moment must be/)
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.moment = 5
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('modulus', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.modulus = 40
      assert.strictEqual(b.modulus, 40)
    })

    it('should throw if given the wrong type', () => {
      const b = new Beam()
      assert.throws(() => { b.modulus = 'forty' }, /TypeError: modulus must be/)
      assert.throws(() => { b.modulus = -40 }, /TypeError: modulus must be/)
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.modulus = 40
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('contLoad', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.contLoad = x => x * x
      assert.strictEqual(b.contLoad(10), 100)
    })

    it('should throw if given the wrong type', () => {
      const b = new Beam()
      assert.throws(() => { b.contLoad = 'five' }, /TypeError: contLoad must be/)
      assert.throws(() => { b.contLoad = 5 }, /TypeError: contLoad must be/)
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.contLoad = x => x * x
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('anchorLeft, anchorRight', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.anchorLeft = 'fixed'
      b.anchorRight = 'free'
      assert.strictEqual(b.anchorLeft, 'fixed')
      assert.strictEqual(b.anchorRight, 'free')
      assert.strictEqual(b._anchor[0], 'fixed')
      assert.strictEqual(b._anchor[1], 'free')
    })

    it('should throw if given the wrong type', () => {
      const b = new Beam()
      assert.throws(() => { b.anchorLeft = 'floating' }, /TypeError: anchorLeft must be/)
      assert.throws(() => { b.anchorRight = 5 }, /TypeError: anchorRight must be/)
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.anchorLeft = 'free'
      assert.strictEqual(b._isSolved, false)
      b._isSolved = true
      b.anchorRight = 'fixed'
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('pointLoads', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.pointLoads = [{ x: 4, w: 5 }, { x: 6, w: 3 }]
      assert.deepStrictEqual(b.pointLoads, [{ x: 4, w: 5 }, { x: 6, w: 3 }])
    })

    it('should throw if given the wrong type', () => {
      const b = new Beam()
      assert.throws(() => { b.pointLoads = { x: 4, w: 5 } }, /TypeError: pointLoads must be an array/)
    })

    it('assignment should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.pointLoads = [{ x: 4, w: 5 }, { x: 6, w: 3 }]
      assert.strictEqual(b._isSolved, false)
    })

    it('property assignment should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.pointLoads[0] = { x: 4, w: 5 }
      b.pointLoads[1] = { x: 6, w: 3 }
      assert.deepStrictEqual(b.pointLoads, [{ x: 4, w: 5 }, { x: 6, w: 3 }])
      assert.strictEqual(b._isSolved, false)
    })

    it('array prototype method calls should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.pointLoads.push({ x: 4, w: 5 })
      b.pointLoads.push({ x: 6, w: 3 })
      assert.deepStrictEqual(b.pointLoads, [{ x: 4, w: 5 }, { x: 6, w: 3 }])
      assert.strictEqual(b._isSolved, false)
      b._isSolved = true
      assert.strictEqual(b._isSolved, true)
      b.pointLoads.pop()
      assert.deepStrictEqual(b.pointLoads, [{ x: 4, w: 5 }])
      assert.strictEqual(b._isSolved, false)
    })

    it('should throw if attempting to add an invalid pointLoad', () => {
      let b = new Beam()
      assert.throws(() => { b.pointLoads.push({ x: 'not a valid point load', w: 'definitely not' }) }, /A point load must be an object of type: \{ x: number, w: number \}/)

      b = new Beam()
      assert.throws(() => { b.pointLoads[1] = { x: 4 } }, /A point load must be an object of type: \{ x: number, w: number \}/)

      b = new Beam()
      let a
      assert.throws(() => { b.pointLoads.push(a) }, /A point load must be an object of type: \{ x: number, w: number \}/)
    })

    it('should throw if attempting to mutate a pointLoad', () => {
      const b = new Beam()
      let a = { x: 4, w: 5 }
      b.pointLoads.push(a)
      assert.throws(() => { a.x = 6 }, /Cannot assign to read only property/)
      assert.deepStrictEqual(b.pointLoads, [{ x: 4, w: 5 }])

      a = b.addPointLoad({ x: 6, w: 8 })
      assert.throws(() => { a.x = 10 }, /Cannot assign to read only property/)
      assert.deepStrictEqual(b.pointLoads, [{ x: 4, w: 5 }, { x: 6, w: 8 }])

      const b2 = new Beam()
      a = { x: 20, w: 30 }
      b2.addPointLoad(a)
      assert.throws(() => { a.x = 25 }, /Cannot assign to read only property/)
    })
  })

  describe('addPointLoad', () => {
    it('should add a point load', () => {
      const b = new Beam()
      let a = b.addPointLoad(10, 20)
      assert.deepStrictEqual(b.pointLoads, [{ x: 10, w: 20 }])
      assert.deepStrictEqual(a, { x: 10, w: 20 })

      a = b.addPointLoad({ x: 40, w: 50 })
      assert.deepStrictEqual(b.pointLoads, [{ x: 10, w: 20 }, { x: 40, w: 50 }])
      assert.deepStrictEqual(a, { x: 40, w: 50 })
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.addPointLoad(10, 20)
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('removePointLoad', () => {
    it('should remove a point load', () => {
      const b = new Beam()
      const p1 = b.addPointLoad(10, 20)
      b.addPointLoad(15, 30)
      assert.deepStrictEqual(b.pointLoads, [{ x: 10, w: 20 }, { x: 15, w: 30 }])
      b.removePointLoad(p1)
      assert.deepStrictEqual(b.pointLoads, [{ x: 15, w: 30 }])
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      const p1 = b.addPointLoad(10, 20)
      b._isSolved = true
      assert.strictEqual(b._isSolved, true)
      b.removePointLoad(p1)
      assert.strictEqual(b._isSolved, false)
    })

    it('should throw if the point load is not found', () => {
      const b = new Beam()
      const p1 = b.addPointLoad(10, 20)
      b.addPointLoad(15, 30)
      assert.deepStrictEqual(b.pointLoads, [{ x: 10, w: 20 }, { x: 15, w: 30 }])
      assert.throws(() => { b.removePointLoad({ x: 10, w: 20 }) }, /Error: The given point load was not found. \(Point loads are matched by reference, not value.\)/)
      assert.doesNotThrow(() => { b.removePointLoad(p1) })
      assert.deepStrictEqual(b.pointLoads, [{ x: 15, w: 30 }])
      assert.throws(() => { b.removePointLoad(p1) }, /Error: The given point load was not found. \(Point loads are matched by reference, not value.\)/)
    })
  })

  describe('pins', () => {
    it('should get and set', () => {
      const b = new Beam()
      b.pins = [{ x: 4 }, { x: 6 }]
      assert.deepStrictEqual(b.pins, [{ x: 4 }, { x: 6 }])
    })

    it('should throw if given the wrong type', () => {
      const b = new Beam()
      assert.throws(() => { b.pins = { x: 4 } }, /TypeError: pins must be an array/)
    })

    it('assignment should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.pins = [{ x: 4 }, { x: 6 }]
      assert.strictEqual(b._isSolved, false)
    })

    it('property assignment should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.pins[0] = { x: 4 }
      b.pins[1] = { x: 6 }
      assert.deepStrictEqual(b.pins, [{ x: 4 }, { x: 6 }])
      assert.strictEqual(b._isSolved, false)
    })

    it('array prototype method calls should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.pins.push({ x: 4 })
      b.pins.push({ x: 6 })
      assert.deepStrictEqual(b.pins, [{ x: 4 }, { x: 6 }])
      assert.strictEqual(b._isSolved, false)
      b._isSolved = true
      assert.strictEqual(b._isSolved, true)
      b.pins.pop()
      assert.deepStrictEqual(b.pins, [{ x: 4 }])
      assert.strictEqual(b._isSolved, false)
    })

    it('should throw if attempting to add an invalid pin', () => {
      let b = new Beam()
      assert.throws(() => { b.pins.push({ x: 'not a valid pin' }) }, /A pin must be an object with a single property `x` of type number/)

      b = new Beam()
      assert.throws(() => { b.pins[1] = { y: 4 } }, /A pin must be an object with a single property `x` of type number/)

      b = new Beam()
      let a
      assert.throws(() => { b.pins.push(a) }, /A pin must be an object with a single property `x` of type number/)
    })

    it('should throw if attempting to mutate a pin', () => {
      const b = new Beam()
      let a = { x: 4 }
      b.pins.push(a)
      assert.throws(() => { a.x = 6 }, /Cannot assign to read only property/)
      assert.deepStrictEqual(b.pins, [{ x: 4 }])

      a = b.addPin({ x: 6 })
      assert.throws(() => { a.x = 10 }, /Cannot assign to read only property/)
      assert.deepStrictEqual(b.pins, [{ x: 4 }, { x: 6 }])

      const b2 = new Beam()
      a = { x: 20 }
      b2.addPin(a)
      assert.throws(() => { a.x = 25 }, /Cannot assign to read only property/)
    })
  })

  describe('addPin', () => {
    it('should add a pin', () => {
      const b = new Beam()
      let a = b.addPin(10)
      assert.deepStrictEqual(b.pins, [{ x: 10 }])
      assert.deepStrictEqual(a, { x: 10 })

      a = b.addPin({ x: 40 })
      assert.deepStrictEqual(b.pins, [{ x: 10 }, { x: 40 }])
      assert.deepStrictEqual(a, { x: 40 })
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      b._isSolved = true
      b.addPin(10)
      assert.strictEqual(b._isSolved, false)
    })
  })

  describe('removePin', () => {
    it('should remove a pin', () => {
      const b = new Beam()
      const p1 = b.addPin(10)
      b.addPin(15)
      assert.deepStrictEqual(b.pins, [{ x: 10 }, { x: 15 }])
      b.removePin(p1)
      assert.deepStrictEqual(b.pins, [{ x: 15 }])
    })

    it('should reset _isSolved flag', () => {
      const b = new Beam()
      const p1 = b.addPin(10)
      b._isSolved = true
      assert.strictEqual(b._isSolved, true)
      b.removePin(p1)
      assert.strictEqual(b._isSolved, false)
    })

    it('should throw if the pin is not found', () => {
      const b = new Beam()
      const p1 = b.addPin(10)
      b.addPin(15)
      assert.deepStrictEqual(b.pins, [{ x: 10 }, { x: 15 }])
      assert.throws(() => { b.removePin({ x: 10 }) }, /Error: The given pin was not found. \(Pins are matched by reference, not value.\)/)
      assert.doesNotThrow(() => { b.removePin(p1) })
      assert.deepStrictEqual(b.pins, [{ x: 15 }])
      assert.throws(() => { b.removePin(p1) }, /Error: The given pin was not found. \(Pins are matched by reference, not value.\)/)
    })
  })

  describe('_createGrid', () => {
    it('should create an evenly spaced grid', () => {
      const b = new Beam()
      b.length = 10

      let grid = b._createGrid(5)
      assert.deepStrictEqual(grid, [{ x: 0 }, { x: 2 }, { x: 4 }, { x: 6 }, { x: 8 }, { x: 10 }])

      grid = b._createGrid(1)
      assert.deepStrictEqual(grid, [{ x: 0 }, { x: 10 }])
    })

    it('should add point loads to the grid and sort them', () => {
      const b = new Beam()
      b.length = 10
      b.addPointLoad(5, 10)
      b.addPointLoad(8.5, 10)
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        { x: 0 },
        { x: 2 },
        { x: 4 },
        {
          x: 5,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: -1
        },
        {
          x: 5,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: 1
        },
        { x: 6 },
        { x: 8 },
        {
          x: 8.5,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: -1
        },
        {
          x: 8.5,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: 1
        },
        { x: 10 }
      ])
    })

    it('should replace an existing grid point if a point load falls on the grid', () => {
      const b = new Beam()
      b.length = 10
      b.addPointLoad(4, 10)
      b.addPointLoad(6, 10)
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        { x: 0 },
        { x: 2 },
        {
          x: 4,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: -1
        },
        {
          x: 4,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: 1
        },
        {
          x: 6,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: -1
        },
        {
          x: 6,
          isPointLoad: true,
          pointLoad: 10,
          relationToFeature: 1
        },
        { x: 8 },
        { x: 10 }
      ])
    })

    it('should combine duplicate point loads', () => {
      const b = new Beam()
      b.length = 10
      b.addPointLoad(4, 10)
      b.addPointLoad(4, 10)
      b.addPointLoad(4, 10)
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        { x: 0 },
        { x: 2 },
        {
          x: 4,
          isPointLoad: true,
          pointLoad: 30,
          relationToFeature: -1
        },
        {
          x: 4,
          isPointLoad: true,
          pointLoad: 30,
          relationToFeature: 1
        },
        { x: 6 },
        { x: 8 },
        { x: 10 }
      ])
    })
    it('should add pins to the grid and sort them', () => {
      const b = new Beam()
      b.length = 10
      b.addPin(5)
      b.addPin(8.5)
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        { x: 0 },
        { x: 2 },
        { x: 4 },
        {
          x: 5,
          isPin: true,
          relationToFeature: -1
        },
        {
          x: 5,
          isPin: true,
          relationToFeature: 1
        },
        { x: 6 },
        { x: 8 },
        {
          x: 8.5,
          isPin: true,
          relationToFeature: -1
        },
        {
          x: 8.5,
          isPin: true,
          relationToFeature: 1
        },
        { x: 10 }
      ])
    })

    it('should replace an existing grid point if a pin falls on the grid', () => {
      const b = new Beam()
      b.length = 10
      b.addPin(4)
      b.addPin(6)
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        { x: 0 },
        { x: 2 },
        {
          x: 4,
          isPin: true,
          relationToFeature: -1
        },
        {
          x: 4,
          isPin: true,
          relationToFeature: 1
        },
        {
          x: 6,
          isPin: true,
          relationToFeature: -1
        },
        {
          x: 6,
          isPin: true,
          relationToFeature: 1
        },
        { x: 8 },
        { x: 10 }
      ])
    })

    it('should allow pins and pointLoads at the same location', () => {
      const b = new Beam()
      b.length = 10
      b.addPointLoad(4, 10)
      b.addPointLoad(5, 20)
      b.addPin(4)
      b.addPin(5)
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        { x: 0 },
        { x: 2 },
        {
          x: 4,
          pointLoad: 10,
          isPointLoad: true,
          isPin: true,
          relationToFeature: -1
        },
        {
          x: 4,
          pointLoad: 10,
          isPointLoad: true,
          isPin: true,
          relationToFeature: 1
        },
        {
          x: 5,
          pointLoad: 20,
          isPointLoad: true,
          isPin: true,
          relationToFeature: -1
        },
        {
          x: 5,
          pointLoad: 20,
          isPointLoad: true,
          isPin: true,
          relationToFeature: 1
        },
        { x: 6 },
        { x: 8 },
        { x: 10 }
      ])
    })

    it('should add second grid point for fixed anchors', () => {
      const b = new Beam()
      b.length = 10
      b.anchorRight = 'fixed'
      b.anchorLeft = 'fixed'
      let grid = b._createGrid(5)

      assert.deepStrictEqual(grid, [
        {
          x: 0,
          isFixedAnchor: true,
          relationToFeature: -1
        },
        {
          x: 0,
          isFixedAnchor: true,
          relationToFeature: 1
        },
        { x: 2 },
        { x: 4 },
        { x: 6 },
        { x: 8 },
        {
          x: 10,
          isFixedAnchor: true,
          relationToFeature: -1
        },
        {
          x: 10,
          isFixedAnchor: true,
          relationToFeature: 1
        }
      ])
    })

    it('should throw if numGridPts is not a positive integer', () => {
      const b = new Beam()
      b.length = 10
      assert.throws(() => { b._createGrid() }, /TypeError: numGridPts must be a positive integer./)
      assert.throws(() => { b._createGrid('five') }, /TypeError: numGridPts must be a positive integer./)
      assert.throws(() => { b._createGrid(-3) }, /TypeError: numGridPts must be a positive integer./)
      assert.throws(() => { b._createGrid(10.2) }, /TypeError: numGridPts must be a positive integer./)
    })
  })

  describe('solve', () => {
    it('should calculate vbar, mbar, thetabar, and ybar', () => {
      let b = new Beam()
      b.length = 10
      b.moment = 1
      b.modulus = 1
      b.solve(5)
      assert.deepStrictEqual(b.grid.map(g => g.x), [0, 2, 4, 6, 8, 10])
      assert.deepStrictEqual(b.grid.map(g => g.vbar), [0, 0, 0, 0, 0, 0])
      assert.deepStrictEqual(b.grid.map(g => g.mbar), [0, 0, 0, 0, 0, 0])
      assert.deepStrictEqual(b.grid.map(g => g.thetabar), [0, 0, 0, 0, 0, 0])
      assert.deepStrictEqual(b.grid.map(g => g.ybar), [0, 0, 0, 0, 0, 0])
      // thetabar
      // ybar

      b = new Beam()
      b.length = 10
      b.moment = 1
      b.modulus = 1
      b.contLoad = () => 3
      b.solve(5)
      assert.deepStrictEqual(b.grid.map(g => g.x), [0, 2, 4, 6, 8, 10])
      assert.deepStrictEqual(b.grid.map(g => g.vbar), [0, 6, 12, 18, 24, 30]) // 3 * x
      assert.deepStrictEqual(b.grid.map(g => g.mbar), [0, 6, 24, 54, 96, 150]) // 3 * x^2/2
      assert.deepStrictEqual(b.grid.map(g => g.thetabar), [0, 4, 32, 108, 256, 500]) // 3 * x^3/6
      assert.deepStrictEqual(b.grid.map(g => g.ybar), [0, 2, 32, 162, 512, 1250]) // 3 * x^4/24

      // This will not be an exact answer
      b = new Beam()
      b.length = 10
      b.moment = 1
      b.modulus = 1
      b.contLoad = x => x
      b.solve(5)
      assert.deepStrictEqual(b.grid.map(g => g.x), [0, 2, 4, 6, 8, 10])
      assert.deepStrictEqual(b.grid.map(g => g.vbar), [0, 2, 8, 18, 32, 50]) // x^2/2
      assert.deepStrictEqual(b.grid.map(g => g.mbar), [0, 1.375, 10.75, 36.125, 85.5, 166.875]) // x^3/6.  Exact should be [0, 1.333, 10.666, 36, 85.333, 166.666]
      approx.deepEqual(b.grid.map(g => g.thetabar), [0, 0.7083, 10.8333, 54.375, 171.3333, 417.7083]) // x^4/24.  Exact should be [0, 0.666, 10.666, 54, 170.666, 416.666]
      approx.deepEqual(b.grid.map(g => g.ybar), [0, 0.30555, 8.7777, 65.5833, 274.888, 836.861]) // x^5/120.  Exact should be [0, 0.2666, 8.5333, 64.8, 273.0667, 833.33]

      b = new Beam()
      b.length = 10
      b.moment = 1
      b.modulus = 1
      b.contLoad = x => x
      b.solve(500)
      approx.equal(b.grid[500].x, 10)
      approx.equal(b.grid[500].vbar, 50)
      approx.equal(b.grid[500].mbar, 1000 / 6) // 166.666666...
      approx.equal(b.grid[500].thetabar, 10000 / 24)
      approx.equal(b.grid[500].ybar, 100000 / 120)

      b = new Beam()
      b.length = 100
      b.moment = 1
      b.modulus = 1
      b.contLoad = x => x
      b.solve(500)
      approx.equal(b.grid[500].x, 100)
      approx.equal(b.grid[500].vbar, 5000)
      approx.equal(b.grid[500].mbar, 1000000 / 6)
      approx.equal(b.grid[500].thetabar, 100000000 / 24)
      approx.equal(b.grid[500].ybar, 10000000000 / 120)

      b = new Beam()
      b.length = 10
      b.moment = 1
      b.modulus = 1
      b.addPointLoad(5, 100)
      b.solve(5)
      assert.deepStrictEqual(b.grid.map(g => g.x), [0, 2, 4, 5, 5, 6, 8, 10])
      assert.deepStrictEqual(b.grid.map(g => g.vbar), [0, 0, 0, 0, 100, 100, 100, 100])
      assert.deepStrictEqual(b.grid.map(g => g.mbar), [0, 0, 0, 0, 0, 100, 300, 500])
      assert.deepStrictEqual(b.grid.map(g => g.thetabar), [0, 0, 0, 0, 0, 50, 450, 1250])
      approx.deepEqual(b.grid.map(g => g.ybar), [0, 0, 0, 0, 0, 16.6667, 450, 2083.3333])

      b = new Beam()
      b.length = 10
      b.moment = 1
      b.modulus = 1
      b.addPointLoad(4, 100)
      b.solve(5)
      assert.deepStrictEqual(b.grid.map(g => g.x), [0, 2, 4, 4, 6, 8, 10])
      assert.deepStrictEqual(b.grid.map(g => g.vbar), [0, 0, 0, 100, 100, 100, 100])
      assert.deepStrictEqual(b.grid.map(g => g.mbar), [0, 0, 0, 0, 200, 400, 600])
      assert.deepStrictEqual(b.grid.map(g => g.thetabar), [0, 0, 0, 0, 200, 800, 1800])
      approx.deepEqual(b.grid.map(g => g.ybar), [0, 0, 0, 0, 133.3333, 1066.6667, 3600])
    })

    it('should correctly calculate reactive loads and moments with single fixed anchor', () => {
      // One point load in center
      let b = new Beam()
      b.length = 10
      b.moment = 10
      b.modulus = 10
      b.anchorLeft = 'fixed'
      b.anchorRight = 'free'
      let ptLd = b.addPointLoad(5, 100)
      b.solve(50)
      approx.equal(b.soln.p0, 100)
      approx.equal(b.soln.m0, 500)

      // Move point load off-center
      b.removePointLoad(ptLd)
      ptLd = b.addPointLoad(3, 60)
      b.solve(50)
      approx.equal(b.soln.p0, 60)
      approx.equal(b.soln.m0, 180)

      // Move anchor to other side
      b.anchorLeft = 'free'
      b.anchorRight = 'fixed'
      b.solve(50)
      approx.equal(b.soln.pL, 60)
      approx.equal(b.soln.mL, -420)

      // Replace point load with continuous load
      b.pointLoads = []
      b.contLoad = x => 1
      b.solve(50)
      approx.equal(b.soln.pL, 10)
      approx.equal(b.soln.mL, -50)

      // Move anchor to other side
      b.anchorLeft = 'fixed'
      b.anchorRight = 'free'
      b.solve(50)
      approx.equal(b.soln.p0, 10)
      approx.equal(b.soln.m0, 50)
    })

    it('should correctly calculate reactive loads with two pins', () => {
      // Beam with one point load
      let b = new Beam()
      b.length = 10
      b.moment = 10
      b.modulus = 10
      b.anchorLeft = 'free'
      b.anchorRight = 'free'
      b.addPin(0)
      b.addPin(10)
      b.addPointLoad(4, 100)
      b.solve(50)
      approx.equal(b.soln.pin0, 60)
      approx.equal(b.soln.pin1, 40)

      // Add a second point load
      b.addPointLoad(5, 50)
      b.solve(50)
      approx.equal(b.soln.pin0, 85)
      approx.equal(b.soln.pin1, 65)

      // Cantilevered beam
      b.pins = [{ x: 0 }, { x: 5 }]
      b.pointLoads = [{ x: 10, w: 100 }]
      b.anchorLeft = 'free'
      b.anchorRight = 'free'
      b.solve(50)
      approx.equal(b.soln.pin0, -100)
      approx.equal(b.soln.pin1, 200)

      // Continuous loads
      b.pointLoads = []
      b.contLoad = x => 1
      b.solve(50)
      approx.equal(b.soln.pin0, 0)
      approx.equal(b.soln.pin1, 10)
    })

    it('calculated values should satisfy boundary conditions', () => {
      let b = new Beam()
      b.length = 10
      b.moment = 3
      b.modulus = 3
      b.anchorLeft = 'free'
      b.anchorRight = 'free'
      b.addPin(4)
      b.addPin(6)
      b.addPointLoad(2, 1)
      b.addPointLoad(5, 2)
      b.addPointLoad(8, 1)
      b.solve(5)
      approx.equal(b.grid[0].v, 0)
      approx.equal(b.grid[0].m, 0)
      approx.equal(b.grid[b.grid.length - 1].v, 0)
      approx.equal(b.grid[b.grid.length - 1].m, 0)

      b.anchorLeft = 'fixed'
      b.anchorRight = 'fixed'
      b.pins = []
      b.solve(20)
      approx.equal(b.grid[0].v, 0)
      approx.equal(b.grid[0].m, 0)
      approx.equal(b.grid[0].theta, 0)
      approx.equal(b.grid[0].y, 0)
      approx.equal(b.grid[b.grid.length - 1].v, 0)
      approx.equal(b.grid[b.grid.length - 1].m, 0)
      approx.equal(b.grid[b.grid.length - 1].theta, 0)
      approx.equal(b.grid[b.grid.length - 1].y, 0)

      b.anchorLeft = 'free'
      b.anchorRight = 'fixed'
      b.pins = []
      b.solve(20)
      approx.equal(b.grid[0].v, 0)
      approx.equal(b.grid[0].m, 0)
      approx.equal(b.grid[b.grid.length - 1].v, 0)
      approx.equal(b.grid[b.grid.length - 1].m, 0)
      approx.equal(b.grid[b.grid.length - 1].theta, 0)
      approx.equal(b.grid[b.grid.length - 1].y, 0)

      b.anchorLeft = 'fixed'
      b.anchorRight = 'free'
      b.pins = []
      b.solve(20)
      approx.equal(b.grid[0].v, 0)
      approx.equal(b.grid[0].m, 0)
      approx.equal(b.grid[0].theta, 0)
      approx.equal(b.grid[0].y, 0)
      approx.equal(b.grid[b.grid.length - 1].v, 0)
      approx.equal(b.grid[b.grid.length - 1].m, 0)
    })

    it('should correctly calculate deflection in simply supported beam with uniform load', () => {
      let b = new Beam()
      b.length = 5
      b.modulus = 20
      b.moment = 30
      b.anchorLeft = 'free'
      b.anchorRight = 'free'
      b.addPin(0)
      b.addPin(b.length)
      b.contLoad = () => -4

      // Exact solution:
      // y(x) = -w x / (24 E I) * (x^3 - 2 L x^2 + L^3)

      b.solve(10)
      approx.equal(b.grid[0].y, 0)
      approx.equal(b.grid[2].y, -0.01703125)
      approx.equal(b.grid[4].y, -0.04411458333333334)
      approx.equal(b.grid[6].y, -0.054253472222222224)
      approx.equal(b.grid[8].y, -0.04411458333333334)
      approx.equal(b.grid[10].y, -0.01703125)
      approx.equal(b.grid[12].y, 0)
    })

    it('should correctly calculate deflection in simply supported beam with point load', () => {
      let b = new Beam()
      b.length = 5
      b.modulus = 20
      b.moment = 30
      b.anchorLeft = 'free'
      b.anchorRight = 'free'
      b.addPin(0)
      b.addPin(b.length)
      b.addPointLoad(2.5, -40)

      // Exact solution:
      // y(L/2) = p L^3 / (48 E I)

      b.solve(10)
      approx.equal(b.grid[0].y, 0)
      approx.equal(b.grid[6].y, -0.1736111111111111)
      approx.equal(b.grid[12].y, 0)
    })
  })
})
