# beam-calculator

## Proposed API:

### Usage:

```js
import Beam from 'Beam'

let b = new Beam()
Beam.setUnits('metric') // kg, m, N, etc.

b.setLength(20) // m

b.setCrossSection(100) // 

b.setMoment(100)

b.setMoment(fn)

fn: (x) => moment(x)

Beam.listMaterials()

b.setMaterial('Al6061')

b.addPointLoad()

b.getDeflection(10) // 0.02 m


```

createBeam

addLoad