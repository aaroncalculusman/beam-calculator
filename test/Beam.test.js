import assert from 'assert'
import Beam from '../src/Beam.js'

describe('beam', () => {
  describe('constructor', () => {
    it('should construct an empty beam', () => {
      const b = new Beam()
      assert.strictEqual(b._length, null)
      assert.strictEqual(b._moment, null)
      assert.strictEqual(b._modulus, null)
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
      assert.throws(() => { b.removePointLoad({ x: 10, w: 20 }) }, /Error: The given point load was not found. \(Point loads are matched by reference, not value.\)/)
      assert.doesNotThrow(() => { b.removePointLoad(p1) })
      assert.deepStrictEqual(b.pointLoads, [{ x: 15, w: 30 }])
      assert.throws(() => { b.removePointLoad(p1) }, /Error: The given point load was not found. \(Point loads are matched by reference, not value.\)/)
    })
  })

  describe('solve', () => {
    const b = new Beam()
    b.length = 10
    b.addPointLoad(3, 400)
    b.addPointLoad(1, 100)
    b.solve()
  })
})
