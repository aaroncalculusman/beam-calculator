import assert from 'assert'
import Beam from '../src/Beam.js'

describe('beam', () => {
  describe('constructor', () => {
    it('should construct an empty beam', () => {
      const b = new Beam()
      assert.strictEqual(b._length, null)
      assert.strictEqual(b._moment, null)
      assert.deepStrictEqual(b._pointLoads, [])
      assert.strictEqual(b._contLoad, null)
      assert.deepStrictEqual(b._anchor, ['simple', 'simple'])
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

  })
  
  describe('addPointLoad', () => {
    it('should add a point load', () => {
      const b = new Beam()
      b.addPointLoad(10, 20)
      assert.deepStrictEqual(b.pointLoads, [{ x: 10, w: 20 }])
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
      const p2 = b.addPointLoad(15, 30)
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
      const p2 = b.addPointLoad(15, 30)
      assert.deepStrictEqual(b.pointLoads, [{ x: 10, w: 20 }, { x: 15, w: 30 }])
      assert.throws(() => { b.removePointLoad({ x: 10, w: 20}) }, /Error: The given point load was not found. \(Point loads are matched by reference, not value.\)/)
      assert.doesNotThrow(() => { b.removePointLoad(p1) })
      assert.deepStrictEqual(b.pointLoads, [{ x: 15, w: 30 }])
      assert.throws(() => { b.removePointLoad(p1) }, /Error: The given point load was not found. \(Point loads are matched by reference, not value.\)/)
    })
  })

})