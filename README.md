# Beam Calculator

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

// (Not yet supported)
// Alternatively, set a variable second moment of
// area (tapered beam) by assigning a function to 
// moment. The function accepts a value which is the
// distance from the left end of the beam, and 
// returns the second moment of area at that point.
b.moment = someFunction // (Not yet supported: will throw an error)

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

When a point load is added to a `Beam`, it is frozen and cannot be mutated. If you need to change a point load, first remove it using `removePointLoad`, and then add a new point load.

# The Math

For a beam of constant rigidity $EI$, the Euler-Bernoulli equation describes the relationship between the deflection of the beam and the applied load:

$$EI\frac{\mathrm{d}^4y}{\mathrm{d}x^4} = w(x)$$

Beam Calculator solves for the deflection of a beam through direct integration. This is done in four subsequent integrations, which solve for the shear force ($V$), moment ($M$), slope ($\theta$), and deflection ($y$) of the beam:

$$V(x) = -\int w(x) dx$$

$$M(x) = \int V(x) dx$$

$$\theta(x) = \frac{1}{EI} \int M(x) dx$$

$$y(x) = \int \theta(x) dx$$

Each step introduces an unknown constant of integration. These unknowns are solved for based on the constraints applied to the beam, such as the presence of pinned or fixed anchors. Other unknowns, such as reaction forces from anchors, are solved for in the same way.

Traditionally, different approaches are taken to solve a beam deflection problem depending on the particular anchors present. However, in order to simplify the implementation, we have considered all beams to be free-floating with the same set of boundary conditions. This establishes a base set of equations and unknowns with zero degrees of freedom. Then, each anchor adds either one or two additional equations and unknowns in a predictable way. This allows us to use one implementation to solve any configuration of anchors.

The base set of equations is obtained by considering an unsupported beam. At each end of the beam, the shear force and moment are both zero, since there are no applied moments or forces. For this trivial problem, we have 4 unknowns (the 4 constants of integration) and 4 equations: $V(0) = 0$, $M(0) = 0$, $V(L) = 0$, and $M(L) = 0$.

```
c1, c2, c3, c4

______________________


V(0) = 0      V(L) = 0
M(0) = 0      M(L) = 0
```

Now say we add a pinned joint $p1$ at some location $x1$ on the beam. This introduces one additional unknown, $p1$, the force applied on the beam by the joint. It also introduces another equation: $y(x1) = 0$. There are still zero degrees of freedom:

```
c1, c2, c3, c4, p1

_______________________
    ^
 y(x1) = 0

V(0) = 0      V(L) = 0
M(0) = 0      M(L) = 0
```

If we add a second pin joint, the degrees of freedom remain unchanged:

```
c1, c2, c3, c4, p1, p2

_______________________
    ^             ^  
 y(x1) = 0   y(x2) = 0

V(0) = 0       V(L) = 0
M(0) = 0       M(L) = 0
```

If we add a fixed joint to the left end of the beam, we add two additional unknowns and equations. The unknowns are $p0$ and $m0$, and the equations are $y(0) = 0$ and $\theta(0) = 0$:


```
c1, c2, c3, c4, p1, p2, p0, m0

/|_______________________
/|    ^             ^  
     y(x1) = 0   y(x2) = 0
y(0) = 0
th(0) = 0
V(0) = 0           V(L) = 0
M(0) = 0           M(L) = 0
```

Likewise, if we add a fixed joint to the right side:

```
c1, c2, c3, c4, p1, p2, p0, m0, pL, mL

/|_______________________|/
/|    ^             ^    |/
     y(x1) = 0   y(x2) = 0
y(0) = 0            y(L) = 0
th(0) = 0           th(L) = 0
V(0) = 0            V(L) = 0
M(0) = 0            M(L) = 0
```

Any number of joints can be added in this way, and the degrees of freedom remain unchanged. In practice, only fixed joints on the ends of beams are allowed, because a fixed joint in the middle of a beam would divide it into two independent beams, each having a fixed joint on one end.

Adding a pinned joint to the end of the beam does not alter our original $V(0) = 0$ boundary conditions, so long as we account for the fact that a point load causes a discontinuity in $V$, and that on one side of the discontinuity, the boundary condition will still hold.

Likewise, adding a fixed joint to the end of the beam does not alter the original $M(0) = 0$ boundary condition, since an applied moment causes a discontinuity in $M$, and the boundary still holds on one side of the discontinuity.

Because the constants of integration and anchor forces and moments are unknown, we have to carry them symbolically through the integration. In practice, we begin by first numerically integrating only the known loads on the beam, and add the unknown forces after the integration. We will use an overbar to show that we have ignored the unknown constants of integration and anchor loads and moments:

$$\overline{V}(x) = -\int_0^x w(x) dx$$

$$\overline{M}(x) = \int_0^x \overline V(x) dx$$

$$\overline{\theta}(x) = \frac{1}{EI}  \int_0^x \overline M(x) dx$$

$$\overline{y}(x) = \int_0^x \overline \theta(x) dx$$

 As an example, assume that we have a fixed anchor on the left with reaction force $p_0$ and moment $m_0$, a fixed anchor on the right with reaction force $p_L$ and moment $m_L$, and two pinned joints located at $x_1$ and $x_2$, with unknown reaction forces $p_1$ and $p_2$. The presence of anchors means that the integration is carried out piecewise. The shear force $V$ is then given by:

$$ V(x) = \begin{cases}
\overline{V}(x) + c_1 & x = 0 \\
\overline{V}(x) + c_1 - p_0 & 0 < x < x_1 \\
\overline{V}(x) + c_1 - p_0 - p_1 & x_1 < x < x_2 \\
\overline{V}(x) + c_1 - p_0 - p_1 - p_2 & x_2 < x < L \\
\overline{V}(x) + c_1 - p_0 - p_1 - p_2 - p_L & x = L
\end{cases} $$

The shear force at $x = x_1$ and $x = x_2$ is undefined due to the discontinuities at these points, but this doesn't matter since calculating the integral across a discontinuity is trivial.

The moment $M$ is then given by:

$$ M(x) = \begin{cases}
\overline{M}(x) + c_1 x + c_2 & x = 0 \\
\overline{M}(x) + c_1 x + c_2 - p_0 x + m_0 & 0 < x < x_1 \\
\overline{M}(x) + c_1 x + c_2 - p_0 x - p_1 (x - x_1) + m_0 & x_1 < x < x_2 \\
\overline{M}(x) + c_1 x + c_2 - p_0 x - p_1 (x - x_1) - p_2 (x - x_2) + m_0 & x_2 < x < L \\
\overline{M}(x) + c_1 x + c_2 - p_0 x - p_1 (x - x_1) - p_2 (x - x_2) - p_L (x - L) + m_0 + m_L & x = L
\end{cases} $$

At this point, we recognize that the constants $c_1$ and $c_2$ must both be equal to zero in order to satisfy our first two base equations, $V(0) = 0$ and $M(0) = 0$. We also make a few other simplifications:

$$ M(x) = \begin{cases}
\overline{M}(x) & x = 0 \\
\overline{M}(x) - p_0 x + m_0 & 0 < x < x_1 \\
\overline{M}(x) - p_0 x - p_1 (x - x_1) + m_0 & x_1 < x < x_2 \\
\overline{M}(x) - p_0 x - p_1 (x - x_1) - p_2 (x - x_2) + m_0 & x_2 < x < L \\
\overline{M}(x) - p_0 x - p_1 (x - x_1) - p_2 (x - x_2) + m_0 + m_L & x = L
\end{cases} $$

Now the slope $\theta$ is given by:

$$ \theta(x) = \begin{cases}
\overline{\theta}(x) - \frac{1}{EI}\left(p_0 \frac{x^2}{2} + m_0 x\right) & 0 \le x < x_1 \\
\overline{\theta}(x) - \frac{1}{EI}\left(p_0 \frac{x^2}{2} - p_1 \frac{(x - x_1)^2}{2} + m_0 x\right) & x_1 < x < x_2 \\
\overline{\theta}(x) - \frac{1}{EI}\left(p_0 \frac{x^2}{2} - p_1 \frac{(x - x_1)^2}{2} - p_2 \frac{(x - x_2)^2}{2} + m_0 x\right) & x_2 < x \le L \\
\end{cases} $$

We've taken a bit of a leap here moving from five to three piecewise portions, which one can confirm by working out the various pieces, or simply come to accept by recognizing that $\theta$ must be continuous.

Finally, the deflection $y$ is given by:

$$ y(x) = \begin{cases}
\overline{y}(x) - \frac{1}{EI}\left(p_0 \frac{x^3}{6} + m_0 \frac{x^2}{2}\right) & 0 \le x < x_1 \\
\overline{y}(x) - \frac{1}{EI}\left(p_0 \frac{x^3}{6} - p_1 \frac{(x - x_1)^3}{6} + m_0 \frac{x^2}{2}\right) & x_1 < x < x_2 \\
\overline{y}(x) - \frac{1}{EI}\left(p_0 \frac{x^3}{6} - p_1 \frac{(x - x_1)^3}{6} - p_2 \frac{(x - x_2)^3}{6} + m_0 \frac{x^2}{2}\right) & x_2 < x \le L \\
\end{cases} $$

We have now worked out the expression for the fully generalized beam. Adding additional pinned joints just increases the number of piecewise portions.

At the present time, the implementation requires the beam to have constant rigidity $EI$. This is so that unknowns which appear in intermediate integrations can be carried through symbolically, and all solved simultaneously at the end.

The next step is to perform the numerical integration and calculation of $\overline{V}$, $\overline{M}$, $\overline{\theta}$, and $\overline{y}$. For this we use Simpson's rule, discretizing the functions on a grid of points between 0 and $L$. We also add a grid point at each point load or anchor. During the integration, point loads can create discontinuities. In these cases, two grid points are created with the same x-coordinate, and each is assigned to one side of the discontinuity.

The final step is to solve for the unknown variables $c_3$, $c_4$, and for variables pertaining to unknown anchor forces and moments $p_i$ and $m_i$. Lucky for us, this is a straightforward linear algebra problem that can be solved with a method such as LU-decomposition. The difficulty lies in preparing the matrix and keeping all our ducks in a row.




```
      |
 _____V______
 ^          ^
 p1         p2

Unknowns (4): C3, C4, p1, p2
Equations (4): V(L) = 0, M(L) = 0, y(0) = 0, y(L) = 0
DOF: 0Fixed-free beam

          |
  //|_____V______
  //|      
  p1, m1   

Unknowns (4): C3, C4, p1, m1
Equations (4): th(0) = 0, y(0) = 0, V(L) = 0, M(L) = 0
DOF: 0Fixed-pin beam

          |
  //|_____V______
  //|           ^
  p1, m1        p2

Unknowns (5): C3, C4, p1, m1, p2
Equations (5): th(0) = 0, y(0) = 0, V(L) = 0, M(L) = 0, y(L) = 0
DOF: 0Fixed-fixed beam

          |
  //|_____V______|//
  //|            |//
  p1, m1       p2, m2

Unknowns (6): C3, C4, p1, m1, p2, m2
Equations (6): th(0) = 0, y(0) = 0, V(L) = 0, M(L) = 0, th(L) = 0, y(L) = 0
DOF: 0Three pins in middle of beam
  ___________
    ^  ^  ^ 
    p1 p2 p3

Unknowns (5): C3, C4, p1, p2, p3
Equations (5): V(L) = 0, M(L) = 0, y(x1) = 0, y(x2) = 0, y(x3) = 0
DOF: 0

Unsupported beam
  ___________

Unknowns (2): C3, C4
Equations (2): V(L) = 0, M(L) = 0
DOF: 0
Will result in singular matrix when solvingBeam with single pin
  ___________
    ^
    p1

Unknowns (3): C3, C4, p1
Equations (3): V(L) = 0, M(L) = 0, y(1) = 0
DOF: 0
Will result in singular matrix when solvingUnbalanced beam

          |
  ________V__
   ^   ^
   p1  p2

Unknowns (4): C3, C4, p1, p2
Equations (4): V(L) = 0, M(L) = 0, y(1) = 0, y(2) = 0
DOF: 0
Will solve just fine with one of the pins having a negative load (but it's a pin, not a roller, so it's okay)
```