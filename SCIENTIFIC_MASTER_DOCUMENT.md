# KINETIQ: Scientific Master Document
## Advanced Interactive Physics Laboratory Platform
### Comprehensive Scientific Reference, Computational Architecture, and Pedagogical Visualizations Manual

---

## Section 1: Thermodynamics & Kinetic Theory

### Topic: Kinetic Theory of Gases

#### 1. Scientific Theory & Microscopic Foundations
At the macroscopic scale, a gas is characterized by thermodynamic state variables: pressure $P$, volume $V$, and temperature $T$. The kinetic-molecular theory connects these macroscopic observables to the statistical behavior of a massive ensemble of microscopic particles (atoms or molecules) moving in random directions.

##### Particle Motion & Collisions
A gas is modeled as an ensemble of $N$ identical particles, each of mass $m$, in continuous, rapid, random motion. The volume occupied by the particles themselves is assumed to be negligible compared to the total volume of the container. The particles do not exert long-range forces on one another; they interact only via instantaneous, perfectly elastic collisions with each other and with the container walls. 

##### Pressure Emergence from Wall Impacts
Macroscopic pressure is defined as force per unit area:
$$P = \frac{F}{A}$$
Microscopically, pressure emerges from the cumulative rate of momentum transfer during elastic collisions of gas particles with the boundary walls. Consider a cubical container of side length $L$ aligned with Cartesian axes. When a particle with velocity $\mathbf{v} = (v_x, v_y, v_z)$ undergoes an elastic collision with a wall perpendicular to the $x$-axis, its velocity component $v_x$ is reversed:
$$\Delta p_x = -m v_x - (m v_x) = -2 m v_x$$
The momentum transferred to the wall is $+2 m v_x$. The time interval $\Delta t$ between consecutive collisions of this particle with the same wall is the round-trip travel time:
$$\Delta t = \frac{2 L}{v_x}$$
The average force $F_x$ exerted by a single particle on this wall is the rate of momentum transfer:
$$F_x = \frac{\Delta p_x}{\Delta t} = \frac{2 m v_x}{2 L / v_x} = \frac{m v_x^2}{L}$$
Summing over all $N$ particles, the total force on the wall is:
$$F_{\text{total}} = \frac{m}{L} \sum_{i=1}^{N} v_{x,i}^2$$
Defining the mean-square velocity in the $x$-direction as:
$$\langle v_x^2 \rangle = \frac{1}{N} \sum_{i=1}^{N} v_{x,i}^2$$
We can write:
$$F_{\text{total}} = \frac{N m \langle v_x^2 \rangle}{L}$$
Since the motion is isotropic (random and unbiased in all directions), the mean-square velocities along the three coordinate axes are equal:
$$\langle v^2 \rangle = \langle v_x^2 \rangle + \langle v_y^2 \rangle + \langle v_z^2 \rangle = 3 \langle v_x^2 \rangle \implies \langle v_x^2 \rangle = \frac{1}{3} \langle v^2 \rangle$$
Substituting this into the force equation gives:
$$F_{\text{total}} = \frac{N m \langle v^2 \rangle}{3 L}$$
Pressure is force divided by the area of the wall ($A = L^2$):
$$P = \frac{F_{\text{total}}}{L^2} = \frac{N m \langle v^2 \rangle}{3 L^3} = \frac{N m \langle v^2 \rangle}{3 V}$$
This can be rearranged into the famous relation connecting macroscopic pressure to microscopic kinetic energy:
$$P V = \frac{2}{3} N \left( \frac{1}{2} m \langle v^2 \rangle \right) = \frac{2}{3} N \langle KE \rangle$$

#### 2. Governing Equations & Mathematical Foundations

##### Ideal Gas Law
Combining the macroscopic empirical ideal gas law ($PV = nRT = N k_B T$, where $n$ is the number of moles, $R$ is the universal gas constant, $N$ is the number of molecules, and $k_B$ is the Boltzmann constant) with the kinetic relation:
$$N k_B T = \frac{2}{3} N \langle KE \rangle$$
We isolate the average translational kinetic energy per particle:
$$\langle KE \rangle = \frac{3}{2} k_B T$$
This relation is fundamental: **temperature is a direct measure of the average translational kinetic energy of the gas molecules.**

##### Velocity Metrics
The mean-square velocity is defined as $v_{\text{ms}}^2 = \langle v^2 \rangle$. The root-mean-square velocity ($v_{\text{rms}}$) is the square root of the mean-square velocity:
$$v_{\text{rms}} = \sqrt{\langle v^2 \rangle} = \sqrt{\frac{3 k_B T}{m}}$$
While $v_{\text{rms}}$ is a common metric, the average speed $\langle v \rangle$ and the most probable speed $v_p$ are distinct due to the asymmetry of the velocity distribution:
$$\langle v \rangle = \sqrt{\frac{8 k_B T}{\pi m}}, \quad v_p = \sqrt{\frac{2 k_B T}{m}}$$

##### Maxwell-Boltzmann Distribution
For a classical ideal gas in thermal equilibrium at temperature $T$, the probability density function $f(v)$ of molecular speeds $v$ is given by the Maxwell-Boltzmann distribution:
$$f(v) = 4\pi \left( \frac{m}{2\pi k_B T} \right)^{3/2} v^2 \exp\left( -\frac{m v^2}{2 k_B T} \right)$$
This distribution arises from statistical mechanics by maximizing the thermodynamic entropy subject to the constraints of fixed particle number and fixed total energy (canonical ensemble). The term $v^2$ represents the phase space volume element in spherical coordinates (velocity space shell), while the exponential factor is the Boltzmann factor $\exp(-E / k_B T)$.

```
      f(v)
       ^
       |       /---\
       |      /     \       T1 (Cool)
       |     /       \
       |    /         \
       |  /            \---
       | /                 \_____
       |-------------------------> v
```

##### Mean Free Path ($\lambda$)
Due to the finite size of gas molecules (modeled as spheres of diameter $d$), they undergo collisions with one another. The average distance traveled by a molecule between successive collisions is the mean free path $\lambda$:
$$\lambda = \frac{1}{\sqrt{2} \pi d^2 n_V}$$
where $n_V = N/V$ is the particle number density. The factor of $\sqrt{2}$ accounts for the relative motion of the colliding particles.

##### Brownian Motion
A macroscopic manifestation of molecular collisions is Brownian motion—the random, erratic motion of a visible suspended particle in a fluid. The collisions from surrounding molecules do not perfectly cancel out at every instant due to statistical fluctuations. The mean squared displacement $\langle x^2 \rangle$ of a Brownian particle in one dimension obeys Einstein's relation:
$$\langle x^2 \rangle = 2 D t, \quad D = \frac{k_B T}{6 \pi \eta r}$$
where $D$ is the diffusion coefficient, $\eta$ is the fluid dynamic viscosity, and $r$ is the radius of the Brownian particle.

##### Equipartition Theorem
The average energy associated with any quadratic degree of freedom in a system at thermal equilibrium is $\frac{1}{2} k_B T$. For a monatomic gas, the only degrees of freedom are the 3 translational directions ($x, y, z$), yielding an average energy per molecule of $\frac{3}{2} k_B T$. For a diatomic gas at room temperature, rotational degrees of freedom add 2 more quadratic terms, yielding an average energy of $\frac{5}{2} k_B T$.

##### Entropy Emergence
Entropy $S$ measures the degree of disorder or the number of microscopic configurations (microstates $\Omega$) that correspond to a given macroscopic state (macrostate):
$$S = k_B \ln \Omega$$
In a simulation container, as particles mix or expand into a vacuum, the volume of phase space accessible to them increases, leading to a rise in microstates and a corresponding emergence of entropy.

#### 3. Simulation Mathematics & Numerical Methods
To model kinetic theory dynamically, KINETIQ implements a 2D or 3D molecular dynamics (MD) simulation engine.

##### Particle Hard-Sphere Collision Solver
For $N$ disk-like particles (in 2D) of radii $r_i$ and velocities $\mathbf{v}_i$, elastic collisions are resolved conserving both linear momentum and kinetic energy.
The collision time detection is solved either using fixed timesteps ($\Delta t$) with post-facto overlap resolution, or via an event-driven simulation scheme. In a timestep-based engine, at each frame:
1. Update positions: $\mathbf{x}_i(t + \Delta t) = \mathbf{x}_i(t) + \mathbf{v}_i(t) \Delta t$.
2. Check for overlaps: If distance $d_{ij} = \|\mathbf{x}_i - \mathbf{x}_j\| < r_i + r_j$, resolve the collision.

To resolve a collision between particle $i$ and $j$:
- Find the unit normal vector pointing from $i$ to $j$:
  $$\mathbf{n} = \frac{\mathbf{x}_j - \mathbf{x}_i}{\|\mathbf{x}_j - \mathbf{x}_i\|}$$
- Find the unit tangent vector:
  $$\mathbf{t} = (-n_y, n_x)$$
- Resolve velocities into normal and tangential components:
  $$v_{in} = \mathbf{v}_i \cdot \mathbf{n}, \quad v_{it} = \mathbf{v}_i \cdot \mathbf{t}$$
  $$v_{jn} = \mathbf{v}_j \cdot \mathbf{n}, \quad v_{jt} = \mathbf{v}_j \cdot \mathbf{t}$$
- The tangential velocity components are unaffected by the collision (no friction):
  $$v'_{it} = v_{it}, \quad v'_{jt} = v_{jt}$$
- The normal velocity components undergo a 1D elastic collision:
  $$v'_{in} = \frac{v_{in}(m_i - m_j) + 2 m_j v_{jn}}{m_i + m_j}$$
  $$v'_{jn} = \frac{v_{jn}(m_j - m_i) + 2 m_i v_{in}}{m_i + m_j}$$
- Reconstruct the velocity vectors:
  $$\mathbf{v}'_i = v'_{in} \mathbf{n} + v'_{it} \mathbf{t}$$
  $$\mathbf{v}'_j = v'_{jn} \mathbf{n} + v'_{jt} \mathbf{t}$$

##### Boundary Collisions
If a particle collides with a vertical wall at $x = 0$ or $x = W$:
$$v_{x,i} \leftarrow -v_{x,i}$$
Each such wall collision records the momentum transfer:
$$\Delta p = 2 m |v_{x,i}|$$
The cumulative momentum transfer $\sum \Delta p$ over a rolling time window $\tau$ is used to calculate the microscopic pressure:
$$P = \frac{\sum \Delta p}{\tau \cdot L}$$
where $L$ is the perimeter (in 2D) or area (in 3D) of the boundary.

##### Entropy Estimation via Grid Binning
To compute entropy in real-time, the 2D workspace is partitioned into a grid of $M = R \times C$ spatial cells. Let $n_k$ be the number of particles in cell $k$. The probability of finding a particle in cell $k$ is $p_k = n_k / N$. The spatial Shannon entropy is computed as:
$$H_{\text{spatial}} = -\sum_{k=1}^{M} p_k \ln p_k$$
This value acts as a proxy for physical entropy, capturing density fluctuations and expansion dynamics.

#### 4. Real-World Relevance & Engineering
- **Vacuum Systems:** Designing turbomolecular pumps and vacuum chambers requires understanding molecular flow regimes where the mean free path exceeds chamber dimensions.
- **Aerospace Engineering:** Re-entry vehicles experience rarefied gas dynamics at high altitudes, modeled using the Boltzmann equation rather than continuum Navier-Stokes equations.
- **Microfluidics:** Modeling diffusion and transport processes in biological systems utilizes Brownian motion and Langevin dynamics.

---

## Section 2: Electricity & Magnetism

### Topic: Circuits

#### 1. Scientific Theory & Physical Intuition
An electric circuit is a closed loop that allows charges to circulate under the influence of an electric field. The flow of charge is driven by a potential difference (voltage) established by an energy source (such as a battery) and is regulated by components that impede this flow (resistors).

```
   [Battery (V)] ------(+)-----> Current (I) -----> [Resistor (R)]
         |                                                 |
        (-)------------------------------------------------
```

##### Electric Potential and Voltage ($V$)
Voltage represents the difference in electric potential energy per unit charge between two nodes in a circuit:
$$V = \frac{\Delta U_e}{q}$$
It acts as the "electrical pressure" pushing charge carriers through the conductor.

##### Current ($I$)
Electric current is the rate at which charge passes through a cross-sectional area of a conductor:
$$I = \frac{dq}{dt}$$
In metallic conductors, current is carried by conduction electrons. Despite the high speed of individual electrons ($10^6\text{ m/s}$ due to Fermi energy), they undergo constant collisions with the lattice ions. This results in a slow net drift velocity $\mathbf{v}_d$ on the order of millimeters per second. The relationship is:
$$\mathbf{J} = n q \mathbf{v}_d$$
where $\mathbf{J}$ is the current density, $n$ is the charge carrier density, and $q$ is the elementary charge.

##### Resistance ($R$) & Joule Heating
Resistance is the measure of a component's opposition to current. At the microscopic scale, resistance is caused by electrons scattering off thermal vibrations of the lattice ions and structural impurities. As electrons collide with lattice ions, they transfer kinetic energy to the lattice, causing it to vibrate more vigorously. This macroscopic dissipation of electrical energy into thermal energy is known as **Joule heating**.

##### Kirchhoff's Laws
1. **Kirchhoff's Current Law (KCL):** Charge is conserved. The sum of currents entering any node must equal the sum of currents leaving that node:
   $$\sum I_{\text{in}} = \sum I_{\text{out}} \implies \oint_{\text{node}} \mathbf{J} \cdot d\mathbf{A} = 0$$
2. **Kirchhoff's Voltage Law (KVL):** The electrostatic field is conservative. The sum of potential differences around any closed loop must equal zero:
   $$\sum V_k = 0 \implies \oint_{\text{loop}} \mathbf{E} \cdot d\mathbf{l} = 0$$

##### Energy Transfer and Power ($P$)
The rate at which electrical energy is delivered to a component is:
$$P = I V$$
For a resistor, this energy is dissipated entirely as heat, yielding:
$$P = I^2 R = \frac{V^2}{R}$$

#### 2. Simulation Mathematics & Numerical Solver
To allow users to build arbitrary circuits, KINETIQ utilizes a **Modified Nodal Analysis (MNA)** solver to find voltages and currents in real time.

##### Nodal Equation Formulation
For a circuit with $n$ nodes and $m$ independent voltage sources:
1. Define a reference node (ground, $V_g = 0$).
2. Apply KCL at each of the remaining $n-1$ nodes.
3. Formulate the system of linear equations in matrix form:
   $$\begin{pmatrix} \mathbf{G} & \mathbf{B} \\ \mathbf{B}^T & \mathbf{D} \end{pmatrix} \begin{pmatrix} \mathbf{v} \\ \mathbf{i} \end{pmatrix} = \begin{pmatrix} \mathbf{j} \\ \mathbf{e} \end{pmatrix}$$
   where:
   - $\mathbf{G}$ is an $(n-1) \times (n-1)$ conductance matrix. The diagonal elements $G_{ii}$ are the sums of the conductances ($1/R$) connected to node $i$. The off-diagonal elements $G_{ij}$ are the negative conductances connected between nodes $i$ and $j$.
   - $\mathbf{B}$ is an $(n-1) \times m$ matrix representing the connections of the voltage sources.
   - $\mathbf{v}$ is the vector of unknown node voltages.
   - $\mathbf{i}$ is the vector of currents through the independent voltage sources.
   - $\mathbf{j}$ is the vector of independent current sources entering each node.
   - $\mathbf{e}$ is the vector of voltage source values.
   - $\mathbf{D}$ is an $m \times m$ matrix (all zeros for independent voltage sources).

##### Solving the System
The system is solved at every physics frame using LU Decomposition or Gauss-Seidel iteration to handle dynamic changes (e.g., sliding a resistor's value, toggling a switch, or adding new connections).
For non-linear components (like diodes or light bulbs with temperature-dependent resistance), the Newton-Raphson method is applied iteratively to converge on the operating point:
$$\mathbf{J}_f(\mathbf{x}_k) \Delta \mathbf{x} = -\mathbf{f}(\mathbf{x}_k), \quad \mathbf{x}_{k+1} = \mathbf{x}_k + \Delta \mathbf{x}$$
where $\mathbf{J}_f$ is the Jacobian matrix of the circuit equations.

##### Bulb Brightness Visualization
The visual brightness of light bulb elements is rendered proportional to the power dissipation $P = I^2 R$. The color temperature is mapped dynamically from deep red (low power) to warm yellow and bright white (full power) using a blackbody radiation color lookup table.

---

### Topic: Ohm's Law

#### 1. Scientific Theory & Conductor Physics
Ohm's Law states that the current density $\mathbf{J}$ at any point in a isotropic conductor is directly proportional to the electric field $\mathbf{E}$ at that point:
$$\mathbf{J} = \sigma \mathbf{E}$$
where $\sigma$ is the material conductivity. Under macroscopic conditions for a uniform conductor of length $L$ and cross-sectional area $A$:
$$I = \left(\frac{\sigma A}{L}\right) V \implies V = I R$$
where the resistance $R$ is defined as:
$$R = \rho \frac{L}{A}$$
with resistivity $\rho = 1/\sigma$.

##### Microscopic Classical Drude Model
In the Drude model, conduction electrons of mass $m_e$ and charge $e$ are accelerated by the electric field $\mathbf{E}$ between collisions:
$$\mathbf{a} = -\frac{e \mathbf{E}}{m_e}$$
If the average time between collisions (relaxation time) is $\tau$, the average drift velocity acquired is:
$$\mathbf{v}_d = \mathbf{a} \tau = -\frac{e \mathbf{E} \tau}{m_e}$$
The current density is:
$$\mathbf{J} = -n e \mathbf{v}_d = \left(\frac{n e^2 \tau}{m_e}\right) \mathbf{E}$$
This derives the expression for electrical conductivity:
$$\sigma = \frac{n e^2 \tau}{m_e}$$

##### Temperature Effects on Resistance
As temperature $T$ increases, lattice ions vibrate with larger amplitudes, increasing the scattering cross-section for conduction electrons. This decreases the relaxation time $\tau$ and increases resistivity:
$$\rho(T) = \rho_0 [1 + \alpha(T - T_0)]$$
where $\alpha$ is the temperature coefficient of resistivity.

```
       Resistance (R)
             ^
             |          / (Metal)
             |         /
             |       /
             |      /---- (Semiconductor - decreases with T)
             |    /
             +--------------------> Temperature (T)
```

#### 2. Simulation Design & User Interaction
The simulation lets users adjust voltage, resistivity, and geometry ($L, A$) of a resistor wire.
- **Lattice Collisions Animation:** In the background canvas, metal lattice ions are rendered as oscillating circles. As temperature increases, the amplitude of their oscillation increases, and conduction electrons (small blue dots) are visibly deflected more frequently, slowing down current flow.
- **Dynamic Current Waveform:** A live graph plots $I$ vs $V$. The slope of the line dynamically shifts as the user alters resistivity $\rho$ or wire dimensions.

---

### Topic: Capacitors & RC Circuits

#### 1. Scientific Theory & Transient Dynamics
A capacitor consists of two isolated conductors carrying equal and opposite charges, $+Q$ and $-Q$. The potential difference between them, $V$, is proportional to the accumulated charge:
$$Q = C V$$
where $C$ is the capacitance, determined solely by the geometry of the plates and the dielectric material between them.

##### Parallel-Plate Capacitor & Dielectrics
For a parallel-plate capacitor with plate area $A$ and separation $d$:
$$C = \kappa \epsilon_0 \frac{A}{d}$$
where $\epsilon_0$ is the vacuum permittivity and $\kappa$ (or $\epsilon_r$) is the dielectric constant of the medium.
When a dielectric material is introduced, the external electric field $\mathbf{E}_0$ polarizes the dielectric's atoms/molecules. This polarization creates an internal induced field $\mathbf{E}_{\text{ind}}$ that opposes the external field, reducing the net field:
$$\mathbf{E} = \mathbf{E}_0 - \mathbf{E}_{\text{ind}} = \frac{\mathbf{E}_0}{\kappa}$$
Since the field is reduced for a given charge, the voltage $V = E d$ decreases, which increases the capacitance ($C = Q/V$).

##### Energy Storage
The work required to charge a capacitor is stored as electrostatic potential energy in the electric field:
$$U = \int_0^Q V(q) dq = \int_0^Q \frac{q}{C} dq = \frac{1}{2}\frac{Q^2}{C} = \frac{1}{2} C V^2$$
Expressing this in terms of the energy density $u_E$ in the volume of the field:
$$u_E = \frac{U}{A d} = \frac{1}{2} \epsilon_0 E^2$$

##### Transient Response (RC Circuit)
When charging a capacitor through a resistor $R$ from a constant voltage source $V_0$:
$$V_0 - I(t) R - \frac{Q(t)}{C} = 0 \implies V_0 - R\frac{dq}{dt} - \frac{q}{C} = 0$$
Solving this first-order ordinary differential equation with boundary condition $q(0) = 0$ yields:
$$Q(t) = C V_0 (1 - e^{-t / RC})$$
$$V_c(t) = V_0 (1 - e^{-t / RC})$$
$$I(t) = \frac{V_0}{R} e^{-t / RC}$$
During discharge through a resistor $R$ starting from initial voltage $V_0$:
$$V_c(t) = V_0 e^{-t / RC}$$
The product $\tau = RC$ is the **time constant**, representing the time required for the voltage to change by approximately $63.2\%$ during charging or decay to $36.8\%$ during discharging.

```
      Vc(t)
       ^
    V0 |          /------- (Charging)
       |        /
       |       /
       |      /  \
       |     /    \_____ (Discharging)
       +--------------------> Time (t)
```

#### 2. Simulation & Numerical Integration
For RC transient simulations, KINETIQ solves the differential equation using backward Euler integration to guarantee stability even for small time constants (stiff equations).
$$\frac{q_{t+\Delta t} - q_t}{\Delta t} = \frac{V_0 - q_{t+\Delta t}/C}{R}$$
$$q_{t+\Delta t} = \frac{q_t + \frac{V_0 \Delta t}{R}}{1 + \frac{\Delta t}{RC}}$$
The electric field lines between the plates are dynamically rendered, with their density representing field strength $E = V/d$, and dielectric dipoles orienting themselves in response to the active field.

---

### Topic: Magnetic Fields & Lorentz Force

#### 1. Magnetic Field Lines and Force
Unlike electric charges, magnetic monopoles do not exist; magnetic fields are generated by moving charges or intrinsic magnetic moments (spins). The magnetic field $\mathbf{B}$ is a vector field that exerts forces on other moving charges.

##### Lorentz Force Law
A charge $q$ moving with velocity $\mathbf{v}$ in an electric field $\mathbf{E}$ and magnetic field $\mathbf{B}$ experiences the Lorentz force:
$$\mathbf{F} = q(\mathbf{E} + \mathbf{v} \times \mathbf{B})$$
In a pure magnetic field ($\mathbf{E} = 0$), the magnetic force is perpendicular to both the velocity and the field:
$$\mathbf{F}_B = q(\mathbf{v} \times \mathbf{B})$$
Because $\mathbf{F}_B$ is always orthogonal to $\mathbf{v}$, the work done by the magnetic field on the charge is zero:
$$P = \mathbf{F}_B \cdot \mathbf{v} = q(\mathbf{v} \times \mathbf{B}) \cdot \mathbf{v} = 0$$
Magnetic fields change the direction of a particle's velocity but not its speed or kinetic energy.

##### Cyclotron Motion
If a charge enters a uniform magnetic field $\mathbf{B}$ perpendicularly, the magnetic force acts as a centripetal force:
$$q v B = \frac{m v^2}{r} \implies r = \frac{m v}{q B}$$
The angular frequency of this circular orbit is the cyclotron frequency:
$$\omega_c = \frac{v}{r} = \frac{q B}{m}$$
If the velocity has a component parallel to the field, the particle executes helical motion.

```
             B-Field (Into page x x x)
             x    x    x    x
               /----\
             x |  v |  x    x   (Circular trajectory of positive charge)
               \----+
             x    x    x    x
```

##### Magnetic Domains
Ferromagnetic materials contain microscopic regions called magnetic domains, where the magnetic moments of atoms are aligned due to quantum exchange interactions. In an unmagnetized material, these domains are randomly oriented, canceling each other out. An external $\mathbf{B}$ field aligns the domains, magnetizing the material.

#### 2. Simulation Vector Field Engine
To visualize magnetic fields from currents and dipoles:
- **Biot-Savart Law Solver:** For arbitrary wire geometries carrying current $I$, the magnetic field at position $\mathbf{r}$ is calculated by integrating along the wire:
  $$\mathbf{B}(\mathbf{r}) = \frac{\mu_0 I}{4\pi} \int \frac{d\mathbf{l} \times \hat{\mathbf{r}}'}{r'^2}$$
- **Vector Field Rendering:** The field is displayed using a grid of interactive compass needles or dynamic streamlines. Streamlines are calculated using Runge-Kutta 2nd order (RK2) integration to trace paths tangent to the local field vectors:
  $$\frac{d\mathbf{s}}{ds} = \frac{\mathbf{B}(\mathbf{s})}{\|\mathbf{B}(\mathbf{s})\|}$$
- **Lorentz Force Tracker:** Users can fire charged particles into the field. The simulation integrates the Lorentz equation using Verlet or RK4 integration, showing the deflection and helical wrapping of the particles.

---

### Topic: Electromagnetic Induction

#### 1. Scientific Theory & Faraday's Law
Electromagnetic induction is the process by which a changing magnetic environment produces an electromotive force (EMF) in a conductor.

##### Faraday's Law of Induction
The induced EMF $\mathcal{E}$ in a closed loop is equal to the negative time rate of change of the magnetic flux $\Phi_B$ passing through the loop:
$$\mathcal{E} = -\frac{d\Phi_B}{dt}$$
where the magnetic flux is defined as:
$$\Phi_B = \iint_{S} \mathbf{B} \cdot d\mathbf{A}$$

##### Lenz's Law
The negative sign in Faraday's law represents Lenz's Law: **the direction of the induced current is such that its magnetic field opposes the change in magnetic flux that produced it.** This is a manifestation of the conservation of energy. If the induced field reinforced the change, it would create an unstable runaway feedback loop.

##### Maxwell-Faraday Equation
In differential form, Faraday's law indicates that a time-varying magnetic field induces a non-conservative electric field:
$$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$$

```
                Magnetic Flux Φ(t) increases
                       |
                       v
            Induced EMF E generates current
                       |
                       v
         Induced B-field opposes original flux
```

##### AC Power Generation
In a simple generator, a coil of $N$ turns and area $A$ rotates at constant angular velocity $\omega$ in a uniform magnetic field $B$. The flux through the coil is:
$$\Phi_B(t) = B A \cos(\omega t)$$
The induced EMF is:
$$\mathcal{E}(t) = -N \frac{d\Phi_B}{dt} = N B A \omega \sin(\omega t)$$
This sinusoidal voltage is the foundation of alternating current (AC) power systems.

#### 2. Simulation Requirements & Visual Logic
- **Interactive Faraday Lab:** Users can drag a bar magnet through a wire coil. The simulation calculates the magnetic flux passing through the coil based on the magnet's position and orientation.
- **Induced Current Animation:** The speed and direction of moving electrons in the coil are determined by the magnitude and sign of $\mathcal{E} = -d\Phi_B/dt$.
- **Telemetry Graph:** A dual-trace rolling plot shows the magnetic flux $\Phi_B(t)$ and the induced voltage $\mathcal{E}(t)$ simultaneously, demonstrating the $90^\circ$ phase shift predicted by the derivative relationship.

---

## Section 3: Optics & Wave Physics

### Topic: Reflection & Mirrors

#### 1. Wavefronts and Ray Optics
Light can be modeled as electromagnetic waves (wave optics) or as rays propagating in straight lines perpendicular to wavefronts (geometric optics). Geometric optics is valid when the wavelength $\lambda$ of the light is much smaller than the size of the optical components.

##### Law of Reflection
For any reflecting surface, the angle of reflection $\theta_r$ equals the angle of incidence $\theta_i$, measured relative to the surface normal:
$$\theta_i = \theta_r$$
This law is derived from Fermat's Principle of Least Time, which states that light travels along the path that minimizes travel time.

##### Mirror Equations
For spherical mirrors with radius of curvature $R$ and focal length $f = R/2$:
$$\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}$$
where $d_o$ is the object distance and $d_i$ is the image distance. The sign conventions are:
- Concave mirror: $f > 0$ (converging)
- Convex mirror: $f < 0$ (diverging)
- Real image (in front of mirror): $d_i > 0$
- Virtual image (behind mirror): $d_i < 0$

The lateral magnification $m$ is:
$$m = -\frac{d_i}{d_o} = \frac{h_i}{h_o}$$
where a negative $m$ denotes an inverted image.

```
       Concave Mirror Real Image:
                 Object (h_o)          Mirror
                      |                  /
         -------------|---------F-------|----- (Optic Axis)
                       \       /        \
                        \     /          \
                         Image (h_i)
```

#### 2. Simulation Ray Tracing Engine
The simulation runs a vector-based 2D ray tracer.
- **Ray Intersection Solver:** Light rays are modeled as parametric lines:
  $$\mathbf{r}(t) = \mathbf{o} + t \mathbf{d}$$
  For a spherical mirror surface centered at $\mathbf{c}$ with radius $R$, the intersection is found by solving the quadratic:
  $$\|\mathbf{o} + t\mathbf{d} - \mathbf{c}\|^2 = R^2$$
- **Reflected Vector Calculation:** Upon intersection at point $\mathbf{p}$ with unit surface normal $\mathbf{n}$, the reflected ray direction $\mathbf{d}'$ is computed as:
  $$\mathbf{d}' = \mathbf{d} - 2(\mathbf{d} \cdot \mathbf{n})\mathbf{n}$$
- **Interactive Ray Bundles:** The user can move an object or light source. The engine shoots a bundle of rays (e.g., 50 rays), calculates their intersections and reflections, and highlights the convergence point to visualize real or virtual image formation.

---

### Topic: Refraction & Lenses

#### 1. Wave Propagation at Interfaces
Refraction is the bending of a wave when it enters a medium where its speed changes.

##### Snell's Law
The relationship between the angles of incidence $\theta_1$ and refraction $\theta_2$ is:
$$n_1 \sin\theta_1 = n_2 \sin\theta_2$$
where $n = c/v$ is the refractive index of the medium, and $c$ is the speed of light in vacuum.

```
                  Normal
                    |
          n1        |  / Light Ray
          (Air)     | / θ1
        ------------+------------ Interface
          n2        | \ θ2
          (Glass)   |  \
                    |   \
```

##### Thin Lens Equation
For a thin lens with focal length $f$:
$$\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}$$
The focal length of a lens in air is given by the **Lensmaker's Equation**:
$$\frac{1}{f} = (n - 1) \left( \frac{1}{R_1} - \frac{1}{R_2} \right)$$
where $R_1$ and $R_2$ are the radii of curvature of the two lens surfaces.

#### 2. Simulation Ray Tracing & Refraction Physics
- **Refracted Ray Vector Calculation:** The refracted ray direction $\mathbf{t}$ is calculated using the vector form of Snell's Law:
  $$\mathbf{t} = r \mathbf{d} + \left( r c_1 - \sqrt{1 - r^2 (1 - c_1^2)} \right) \mathbf{n}$$
  where $r = n_1/n_2$ and $c_1 = -\mathbf{n} \cdot \mathbf{d}$. If the term under the square root is negative, **Total Internal Reflection (TIR)** occurs:
  $$\sin\theta_c = \frac{n_2}{n_1} \quad (n_1 > n_2)$$
  In this case, the ray is reflected instead of refracted.
- **Aberration Visualizations:** The engine can render thick lenses, showing spherical aberration (where parallel rays passing through the outer edges of a spherical lens fail to converge at the exact same focal point). This demonstrates the limitations of the thin-lens approximation.

---

### Topic: Wave Diffraction & Huygens' Principle

#### 1. Scientific Theory & Wave Mechanics
When a wavefront encounters an obstacle or slit, it bends around edges. This is known as diffraction. This phenomenon is explained by **Huygens' Principle**: **every point on a wavefront acts as a source of secondary spherical wavelets. The envelope of these wavelets at a later time forms the new wavefront.**

##### Double-Slit and Single-Slit Diffraction
For a single slit of width $a$, the condition for destructive interference (dark fringes) is:
$$a \sin\theta = m\lambda, \quad m = \pm 1, \pm 2, \dots$$
For a diffraction grating or double slit with spacing $d$, the constructive interference maxima occur at:
$$d \sin\theta = m\lambda, \quad m = 0, \pm 1, \pm 2, \dots$$

##### Huygens-Fresnel Integral
Mathematically, the electric field $E(x, y)$ at a screen due to diffraction from an aperture $A$ is given by the Huygens-Fresnel principle:
$$E(x, y) = \frac{1}{i \lambda} \iint_{A} E(x', y') \frac{e^{i k r}}{r} \cos\theta \, dx' dy'$$
where $k = 2\pi/\lambda$, $r$ is the distance from the aperture point $(x', y')$ to the screen point $(x, y)$, and $\cos\theta$ is the obliquity factor. In the far-field limit (Fraunhofer diffraction), this integral simplifies to the 2D Fourier Transform of the aperture transmission function.

```
       Wavefront --->  ||   | \
       Wavefront --->  ||===|  |   Diffracted circular waves
       Wavefront --->  ||   | /
                      Slit
```

#### 2. Simulation Architecture & Fourier Rendering
For wave propagation simulations, KINETIQ supports two modes:
1. **Discrete Wave Huygens Simulator:** A real-time engine that models the wavefront by placing a series of discrete point sources along the slit opening. The wave amplitude at the screen is calculated by summing the contributions from all point sources, taking into account their phase differences:
   $$\Psi(\mathbf{r}, t) = \sum_{j=1}^{N_s} \frac{A_j}{r_j} \cos(k r_j - \omega t)$$
2. **FFT Diffraction Solver:** For arbitrary 2D aperture shapes, the diffraction pattern is calculated in real time using a Fast Fourier Transform (FFT) of the 2D aperture matrix:
   $$I(x, y) \propto \left| \mathcal{F}\{T(x', y')\} \right|^2$$
   The resulting intensity distribution is rendered on the screen as a smooth color heatmap.

---

### Topic: Wave Interference

#### 1. Superposition Principle & Coherence
Wave interference occurs when two or more waves overlap in space. According to the **superposition principle**, the net wave displacement is the algebraic sum of the individual wave displacements:
$$\Psi_{\text{total}}(\mathbf{r}, t) = \Psi_1(\mathbf{r}, t) + \Psi_2(\mathbf{r}, t)$$

##### Constructive and Destructive Interference
Consider two harmonic waves with the same frequency and amplitude $A$, but differing in phase by $\Delta \phi$:
$$\Psi_1 = A \cos(k x - \omega t), \quad \Psi_2 = A \cos(k x - \omega t + \Delta \phi)$$
$$\Psi_{\text{total}} = 2 A \cos\left( \frac{\Delta \phi}{2} \right) \cos\left( k x - \omega t + \frac{\Delta \phi}{2} \right)$$
- **Constructive Interference:** $\Delta \phi = 2m\pi \implies$ Amplitude is maximized ($2A$).
- **Destructive Interference:** $\Delta \phi = (2m+1)\pi \implies$ Amplitude is zero.

##### Young's Double-Slit Experiment
Two coherent light sources separated by distance $d$ project an interference pattern onto a screen at distance $L$. The path length difference $\Delta L$ between the paths from the slits to a point $y$ on the screen is:
$$\Delta L = d \sin\theta \approx d \frac{y}{L}$$
For constructive interference:
$$d \frac{y}{L} = m \lambda \implies y_m = \frac{m \lambda L}{d}$$
The distance between adjacent bright fringes is:
$$\Delta y = \frac{\lambda L}{d}$$

```
                Slits
                | |  \
        --------| |   \          Interference Fringes
                |      \-------- Bright (Constructive)
        --------| |    /-------- Dark (Destructive)
                | |   /
```

#### 2. Simulation Mathematics & Animation
- **Phase Propagation Animation:** The simulation displays two sources generating circular ripples on a 2D canvas. The local wave height at any pixel $(x,y)$ is calculated by summing the contributions from both sources in real time:
  $$H(x, y, t) = A_1 \sin(k d_1 - \omega t) + A_2 \sin(k d_2 - \omega t)$$
- **Dynamic Fringe Adjustments:** A live intensity graph plots the wave intensity $I \propto H^2$ along the screen. The user can adjust source separation $d$ and wavelength $\lambda$. The simulation dynamically scales the fringe spacing $\Delta y$, demonstrating the inverse relationship between slit spacing and fringe width.

---

## Section 4: Modern Physics

### Topic: Photoelectric Effect

#### 1. Quantum vs. Classical Paradigms
The photoelectric effect is the emission of electrons (photoelectrons) when light shines on a metal surface. Classical wave theory predicted that:
1. The kinetic energy of the emitted electrons should increase with the light intensity (wave amplitude).
2. Electron emission should occur at any frequency, provided the light is intense enough.
3. For low light intensities, there should be a measurable time delay while electrons accumulate enough energy to escape the metal.

Experimental results disagreed with all three predictions, showing that:
1. The maximum kinetic energy of emitted electrons depends only on the light frequency, not its intensity.
2. No electrons are emitted if the light frequency is below a threshold frequency $f_0$, regardless of intensity.
3. Electron emission is nearly instantaneous ($< 10^{-9}\text{ s}$), even at low light intensities.

##### Einstein's Photon Hypothesis
To explain these results, Albert Einstein proposed that light is quantized into discrete packets of energy called **photons**:
$$E = h f$$
When a photon collides with an electron in the metal, it transfers its entire energy to that single electron in an all-or-nothing interaction. A portion of this energy is used to overcome the electrostatic binding forces of the metal—this minimum energy is the **work function** $\Phi$. The remaining energy becomes the kinetic energy of the free electron:
$$KE_{\text{max}} = h f - \Phi$$
If $hf < \Phi$, no electrons can escape. The threshold frequency is:
$$f_0 = \frac{\Phi}{h}$$

```
        Light (Photons, E=hf)
             \
              \   Metal Surface
          =====\=====================
                \   e- (kinetic energy = hf - Φ)
                 \^
```

##### Stopping Potential ($V_s$)
By applying an opposing voltage $V$ in a phototube, the flow of photoelectrons can be stopped. The voltage at which the current drops to zero is the stopping potential $V_s$:
$$e V_s = KE_{\text{max}} \implies V_s = \left(\frac{h}{e}\right) f - \frac{\Phi}{e}$$
This linear relationship allows for the experimental determination of Planck's constant $h$.

#### 2. Simulation Modeling & Interface Design
- **Particle Interaction Mechanics:** Photons are rendered as wave packets traveling toward a metal lattice. Upon impact, the engine decides probabilistically whether an electron is released. If $f > f_0$, an electron is spawned at the collision point and moves outward with velocity:
  $$v = \sqrt{\frac{2(hf - \Phi)}{m_e}}$$
- **Dynamic I-V Characterization:** The simulation models a phototube circuit. A real-time plot of current $I$ versus voltage $V$ displays the saturation current (proportional to photon flux/intensity) and the stopping potential (dependent on photon frequency).

---

### Topic: Atomic Models & Quantum Transitions

#### 1. Evolution of Atomic Structures
- **Thomson Model ("Plum Pudding"):** Postulated electrons embedded in a uniform sphere of positive charge.
- **Rutherford Model:** Alpha particle scattering experiments showed that the positive charge and most of the atomic mass are concentrated in a tiny nucleus. However, classical electromagnetism predicted that orbiting electrons would radiate energy continuously and spiral into the nucleus.
- **Bohr Model:** Introduced quantized orbits to resolve this instability:
  1. Electrons orbit the nucleus in stable circular orbits with quantized angular momentum:
     $$L = m_e v r = n \hbar, \quad n = 1, 2, 3, \dots$$
  2. Radiation is emitted or absorbed only when an electron transitions between these orbits:
     $$\Delta E = E_f - E_i = h f$$

##### Bohr Energy Levels for Hydrogen
Using the balance of centripetal and electrostatic forces:
$$\frac{m_e v^2}{r} = \frac{e^2}{4\pi\epsilon_0 r^2}$$
And combining this with quantized angular momentum yields the radius $r_n$ and energy $E_n$ of the $n$-th orbit:
$$r_n = n^2 a_0, \quad a_0 = \frac{4\pi\epsilon_0 \hbar^2}{m_e e^2} \approx 0.529\text{ \AA}$$
$$E_n = -\frac{m_e e^4}{32 \pi^2 \epsilon_0^2 \hbar^2} \frac{1}{n^2} \approx -\frac{13.6\text{ eV}}{n^2}$$

##### Emission Spectra & Rydberg Formula
When transitioning from $n_i \to n_f$:
$$\frac{1}{\lambda} = R_{\infty} \left( \frac{1}{n_f^2} - \frac{1}{n_i^2} \right)$$
where $R_{\infty} \approx 1.097 \times 10^7\text{ m}^{-1}$ is the Rydberg constant.

```
                  n=3 --------------------  E3 = -1.51 eV
                       \  Photon emission
                  n=2 --\-----------------  E2 = -3.40 eV
                         \
                  n=1 ----v---------------  E1 = -13.6 eV
```

##### Quantum Mechanical Model
The Bohr model was later replaced by the Schrödinger equation, which describes electrons as probability clouds (orbitals) rather than localized point masses in orbits.

#### 2. Simulation Requirements
- **Orbital State Visualizer:** Renders the electron state. In Bohr mode, it shows classical circular orbits with the electron jumping between levels. In Quantum mode, it renders the orbital probability density functions (electron clouds) corresponding to hydrogen wavefunctions:
  $$\psi_{n\ell m}(r, \theta, \phi) = R_{n\ell}(r) Y_{\ell}^{m}(\theta, \phi)$$
- **Spectral Telemetry:** A simulated spectrometer displays emission lines (Lyman, Balmer, Paschen series) as the electron transitions between energy states.

---

### Topic: Radioactivity & Nuclear Decay

#### 1. Nuclear Forces & Decay Mechanisms
The nucleus is held together by the strong nuclear force, which overcomes the electrostatic repulsion between protons. However, nuclei with unfavorable proton-to-neutron ratios or those that are too large are unstable and undergo radioactive decay.

##### Decay Modes
1. **Alpha Decay ($\alpha$):** Emission of a helium nucleus ($^4_2\text{He}$) to reduce mass:
   $$^{Z}_{A}\text{X} \to ^{Z-2}_{A-4}\text{Y} + ^4_2\text{He}$$
2. **Beta Decay ($\beta^-$):** Conversion of a neutron into a proton, emitting an electron ($e^-$) and an antineutrino ($\bar{\nu}_e$):
   $$n \to p + e^- + \bar{\nu}_e$$
3. **Gamma Decay ($\gamma$):** Emission of a high-energy photon when a nucleus transitions from an excited state to a lower energy state:
   $$^{Z}_{A}\text{X}^* \to ^{Z}_{A}\text{X} + \gamma$$

##### Radioactive Decay Law
Radioactive decay is a stochastic process. The probability that a nucleus will decay per unit time is the decay constant $\lambda$. For a large ensemble of $N(t)$ radioactive nuclei:
$$\frac{dN}{dt} = -\lambda N(t) \implies N(t) = N_0 e^{-\lambda t}$$
The half-life $T_{1/2}$ is the time required for half of the initial nuclei to decay:
$$T_{1/2} = \frac{\ln 2}{\lambda}$$

```
      N(t)
       ^
    N0 |*
       |  *
       |    *
       |      *  (Exponential Decay)
       |         *
       +--------------------> Time (t)
```

#### 2. Probabilistic Simulation & Monte Carlo Methods
To simulate radioactive decay, KINETIQ runs a Monte Carlo simulation:
- **Probabilistic Decay Step:** For each unstable atom in the simulation grid during timestep $\Delta t$, the probability of decay is:
  $$P_{\text{decay}} = 1 - e^{-\lambda \Delta t} \approx \lambda \Delta t$$
  The engine generates a random number $r \in [0, 1)$. If $r < P_{\text{decay}}$, the atom decays, changing its color, emitting a decay particle ($\alpha$, $\beta$, or $\gamma$), and updating the count of parent and daughter nuclei.
- **Decay Chain Tracker:** The simulator supports multi-step decay chains (e.g., Uranium-238 to Lead-206), plotting the concentrations of each isotope over time.

---

### Topic: Quantum Effects & Wave Packet Dynamics

#### 1. Quantum Mechanical Foundations
In quantum mechanics, particles are described by a complex-valued wavefunction $\Psi(\mathbf{r}, t)$ that satisfies the time-dependent Schrödinger equation:
$$i\hbar \frac{\partial \Psi}{\partial t} = \hat{H}\Psi = \left[ -\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r}) \right] \Psi$$
According to the Born interpretation, the probability density of finding the particle at position $\mathbf{r}$ is:
$$P(\mathbf{r}, t) = |\Psi(\mathbf{r}, t)|^2 = \Psi^* \Psi$$

##### Wave-Particle Duality
All matter exhibits both wave and particle properties. The de Broglie wavelength of a particle with momentum $p$ is:
$$\lambda = \frac{h}{p}$$

##### Heisenberg Uncertainty Principle
The position and momentum of a particle cannot be measured simultaneously with arbitrary precision. The uncertainties $\Delta x$ and $\Delta p$ satisfy:
$$\Delta x \Delta p \ge \frac{\hbar}{2}$$
This is a mathematical property of Fourier transform pairs (wave packets).

##### Quantum Tunneling
When a particle encounters a potential energy barrier of height $V_0$ greater than the particle's energy $E$, classical mechanics predicts that the particle is reflected with $100\%$ probability. Quantum mechanics, however, predicts a non-zero probability that the particle can penetrate and pass through the barrier. Inside the barrier ($V_0 > E$), the spatial wavefunction decays exponentially:
$$\psi(x) \propto e^{-\kappa x}, \quad \kappa = \sqrt{\frac{2m(V_0 - E)}{\hbar^2}}$$
If the barrier is thin, the wavefunction remains non-zero at the opposite edge, allowing the particle to emerge on the other side. The transmission coefficient $T$ is approximately:
$$T \approx e^{-2\kappa L}$$
where $L$ is the width of the barrier.

```
       Wave Packet Wavefunction:
          \  _  /            Barrier
           \/ \/             |===|
           /\_/\____________ |   | _________ (Tunneled Wave)
                             |   |
```

##### Superposition and Entanglement
- **Superposition:** A quantum system can exist in a linear combination of multiple states simultaneously:
  $$|\psi\rangle = c_1 |1\rangle + c_2 |2\rangle$$
  Upon measurement, the wavefunction collapses into one of the eigenstates with probability $|c_i|^2$.
- **Entanglement:** A multi-particle state that cannot be factorized into a product of individual states:
  $$|\psi_{12}\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$$
  Measuring the state of one particle instantly determines the state of the other, regardless of the distance separating them.

#### 2. Simulation Algorithms & Numerical Wave Solvers
To simulate wave packet dynamics and tunneling, the engine solves the 1D Schrödinger equation in real-time.
- **Crank-Nicolson Integration Method:** This implicit, unitary numerical integration scheme preserves the normalization of the wavefunction ($\int |\Psi|^2 dx = 1$) over time:
  $$\left( \mathbf{I} + \frac{i \Delta t}{2\hbar} \mathbf{H} \right) \mathbf{\Psi}^{n+1} = \left( \mathbf{I} - \frac{i \Delta t}{2\hbar} \mathbf{H} \right) \mathbf{\Psi}^n$$
  where $\mathbf{H}$ is the discretized Hamiltonian matrix using a three-point central difference approximation for the second derivative:
  $$H \psi_j = -\frac{\hbar^2}{2m} \frac{\psi_{j+1} - 2\psi_j + \psi_{j-1}}{\Delta x^2} + V_j \psi_j$$
  This tridiagonal system is solved at each timestep using the Thomas algorithm.
- **Wave Packet Visualization:** The simulation displays the real and imaginary parts of the wavefunction ($\text{Re}(\Psi)$, $\text{Im}(\Psi)$) and the probability density $|\Psi|^2$. Users can place potential barriers and observe reflection, transmission, and tunneling.

---

## Section 5: Semiconductor Physics

### Topic: Semiconductor Logic & P-N Junctions

#### 1. Solid-State Theory & Doping
In solid-state physics, the energy states of electrons form continuous bands. The valence band contains bound electrons, while the conduction band contains free, mobile electrons. These bands are separated by an energy gap ($E_g$).
- **Conductors:** Overlapping bands; electrons move freely.
- **Insulators:** Large band gap ($E_g > 9\text{ eV}$); electrons cannot cross.
- **Semiconductors:** Small band gap ($E_g \approx 1-2\text{ eV}$); electrons can be thermally excited into the conduction band, leaving behind vacant states called **holes** in the valence band.

```
       Energy (E)
          ^
          |   ====================== Conduction Band
          |          Band Gap (Eg)
          |   ====================== Valence Band
```

##### Doping
To increase conductivity, impurities are added to the semiconductor lattice:
- **n-type:** Doping with donor atoms (e.g., Phosphorus in Silicon) that introduce extra conduction electrons. The Fermi energy level $E_F$ shifts upward toward the conduction band.
- **p-type:** Doping with acceptor atoms (e.g., Boron in Silicon) that capture electrons, creating extra holes in the valence band. $E_F$ shifts downward toward the valence band.

##### The P-N Junction
When p-type and n-type materials are joined, electrons diffuse from the n-side to the p-side, while holes diffuse from the p-side to the n-side. This diffusion leaves behind charged donor and acceptor ions near the interface. This creates a **depletion region** with an internal electric field $\mathbf{E}_{\text{int}}$ that opposes further diffusion.

```
            P-type              Depletion             N-type
            (Holes)             Region                (Electrons)
          ----------- [ - - - - - | + + + + + ] -----------
                        <--- Internal E-field
```

##### Carrier Transport Currents
The net current density is the sum of drift current (driven by the electric field) and diffusion current (driven by concentration gradients):
$$J_n = q n \mu_n E + q D_n \frac{dn}{dx} \quad (\text{Electrons})$$
$$J_p = q p \mu_p E - q D_p \frac{dp}{dx} \quad (\text{Holes})$$
In equilibrium, the net electron and hole currents are zero.

##### Diode Current-Voltage Relationship
Applying an external voltage $V$ alters the barrier height of the depletion region. The current flow is described by the **Shockley Diode Equation**:
$$I = I_0 \left( e^{\frac{qV}{\eta k_B T}} - 1 \right)$$
where $I_0$ is the reverse saturation current and $\eta$ is the ideality factor.

##### Transistors (MOSFETs) & CMOS Logic
A Metal-Oxide-Semiconductor Field-Effect Transistor (MOSFET) uses an electric field applied to a gate terminal to control the conductivity of a channel between source and drain terminals.
- **n-channel MOSFET (NMOS):** A positive gate voltage attracts electrons, creating a conductive channel between the source and drain.
- **p-channel MOSFET (PMOS):** A negative gate voltage creates a conductive channel for holes.

CMOS (Complementary MOS) logic pairs NMOS and PMOS transistors. This configuration draws power only during switching, making it the foundation of modern digital electronics.

#### 2. Simulation Requirements & Numerical Solvers
- **P-N Junction Carrier Simulator:** Solves the 1D Poisson-Drift-Diffusion equations self-consistently:
  $$\frac{d^2 \phi}{dx^2} = -\frac{q}{\epsilon} (p - n + N_D^+ - N_A^-)$$
  $$\frac{\partial n}{\partial t} = \frac{1}{q}\frac{d J_n}{dx} - U(n, p)$$
  $$\frac{\partial p}{\partial t} = -\frac{1}{q}\frac{d J_p}{dx} - U(n, p)$$
  where $U(n, p)$ represents carrier recombination-generation rates (e.g., Shockley-Read-Hall model).
- **Visualization Logic:** The simulation renders electrons (blue circles) and holes (red circles) diffusing across the junction. A split panel shows the band diagram ($E_c$, $E_v$, $E_F$) bending dynamically as bias voltage changes.
- **Digital Logic Gates:** An interactive schematic editor lets users connect MOSFETs to build logic gates (NAND, NOR, NOT). A real-time timeline plots gate voltages to show switching speeds and propagation delays.

---

## Section 6: Computational Simulation Architecture

### 1. Integration Algorithms & Timestep Simulation
Physics engines approximate continuous systems by integrating differential equations over discrete timesteps $\Delta t$. The choice of numerical integrator involves tradeoffs between accuracy, stability, and computational speed.

Let $\mathbf{x}$ be position and $\mathbf{v}$ be velocity. The system is governed by:
$$\frac{d\mathbf{x}}{dt} = \mathbf{v}, \quad \frac{d\mathbf{v}}{dt} = \mathbf{a}(\mathbf{x}, \mathbf{v}) = \frac{\mathbf{F}(\mathbf{x}, \mathbf{v})}{m}$$

#### Euler Integration
- **Explicit (Forward) Euler:**
  $$\mathbf{x}_{n+1} = \mathbf{x}_n + \mathbf{v}_n \Delta t$$
  $$\mathbf{v}_{n+1} = \mathbf{v}_n + \mathbf{a}_n \Delta t$$
  *Critique:* Simple but unstable for oscillatory systems; introduces artificial energy addition over time.
- **Implicit (Backward) Euler:**
  $$\mathbf{x}_{n+1} = \mathbf{x}_n + \mathbf{v}_{n+1} \Delta t$$
  $$\mathbf{v}_{n+1} = \mathbf{v}_n + \mathbf{a}(\mathbf{x}_{n+1}, \mathbf{v}_{n+1}) \Delta t$$
  *Critique:* Unconditionally stable, but requires solving systems of equations at each step.
- **Semi-Implicit (Euler-Cromer):**
  $$\mathbf{v}_{n+1} = \mathbf{v}_n + \mathbf{a}_n \Delta t$$
  $$\mathbf{x}_{n+1} = \mathbf{x}_n + \mathbf{v}_{n+1} \Delta t$$
  *Critique:* Symplectic (conserves phase space volume); stable for orbital and simple harmonic motion.

#### Verlet Integration
Widely used in particle systems because it does not require explicit velocity calculations to update positions, preserving energy conservation over long runtimes.
- **Standard Verlet:**
  $$\mathbf{x}_{n+1} = 2\mathbf{x}_n - \mathbf{x}_{n-1} + \mathbf{a}_n \Delta t^2$$
- **Velocity Verlet (Preferred):**
  $$\mathbf{x}_{n+1} = \mathbf{x}_n + \mathbf{v}_n \Delta t + \frac{1}{2} \mathbf{a}_n \Delta t^2$$
  $$\mathbf{v}_{n+1} = \mathbf{v}_n + \frac{1}{2} (\mathbf{a}_n + \mathbf{a}_{n+1}) \Delta t$$

#### Runge-Kutta 4th Order (RK4)
A high-accuracy integrator ($O(\Delta t^4)$ error) used for complex dynamics like pendulum double-hinges and orbital trajectories:
$$\mathbf{k}_1 = \mathbf{f}(t_n, \mathbf{y}_n)$$
$$\mathbf{k}_2 = \mathbf{f}\left(t_n + \frac{\Delta t}{2}, \mathbf{y}_n + \frac{\Delta t}{2} \mathbf{k}_1\right)$$
$$\mathbf{k}_3 = \mathbf{f}\left(t_n + \frac{\Delta t}{2}, \mathbf{y}_n + \frac{\Delta t}{2} \mathbf{k}_2\right)$$
$$\mathbf{k}_4 = \mathbf{f}(t_n + \Delta t, \mathbf{y}_n + \Delta t \mathbf{k}_3)$$
$$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{\Delta t}{6} (\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$

---

### 2. Numerical Stability, Errors, and Performance
- **Floating-Point Accumulation Errors:** Repeatedly adding small increments (like $\mathbf{v} \Delta t$) to large positions can lead to precision loss. KINETIQ mitigates this by tracking positions in double precision and using relative coordinates for rendering.
- **Time-Step Constraints (Courant-Friedrichs-Lewy Condition):** For wave simulations on grids, stability requires that information does not propagate faster than one grid cell per timestep:
  $$C = \frac{v \Delta t}{\Delta x} \le 1$$
- **Adaptive Timestepping:** If a collision is imminent, the engine reduces $\Delta t$ dynamically to prevent boundary penetration, returning to the default timestep once resolved.

```
       [Start Frame] ---> [Check CFL Condition]
                               |
                               v
                       [Compute Forces]
                               |
                               v
                     [Collision Detection] -- (Overlap?)
                               |                    | (Yes)
                      (No)     |                    v
                               |            [Sub-step dt / 8]
                               v                    |
                      [Integrate (Verlet/RK4)] <----+
                               |
                               v
                         [Render Frame]
```

---

### 3. Optimization Techniques
- **Spatial Partitioning (Broad-Phase Collisions):** Checking all particle pairs in collision simulations scales as $O(N^2)$. KINETIQ uses a spatial grid hash, dividing the viewport into uniform bins. Particles only check for collisions with others in the same or adjacent bins, reducing the complexity to $O(N)$.
- **Parallel Computing & Web Workers:** Heavy calculations (like Crank-Nicolson solvers and Biot-Savart integrals) are offloaded to background Web Workers to prevent UI blocking.
- **GPU-Accelerated WebGL/WebGPU Rendering:** Wave amplitude fields and particle systems (exceeding 10,000 bodies) are updated and rendered directly on the GPU using custom vertex and fragment shaders.

---

## Section 7: Scientific Visualization Design

### 1. Visualization Philosophy and Pedagogy
The goal of KINETIQ is to make invisible physical phenomena visible, helping users build intuitive mental models of abstract systems.
- **Telemetry Integration:** Telemetry panels display live values (current, velocity, energy) alongside the simulation. This design links visual events directly to mathematical variables.
- **Interactive Control Points:** Users can manipulate parameters in real time using tactile sliders, joysticks, or by dragging elements directly. This active feedback loop reinforces cause-and-effect relationships.
- **Scientific Color Mapping:** Simulations use consistent color schemes to represent data. For example, electrostatic potential uses red for positive and blue for negative, while temperatures are mapped from blue (cold) to red (warm).

---

### 2. Rendering and Animation Architecture
- **Vector Fields & Streamlines:** Rendering magnetic or electric vector fields uses a sparse grid of vector arrows. Arrow directions indicate the field angle, and opacity or color intensity represents magnitude. Streamlines are calculated dynamically, with moving dashes showing the field direction.
- **Heatmaps & Wavefronts:** Wave amplitudes are mapped to standard canvas textures, with positive peaks rendered in blue, negative troughs in red, and nodal lines in black. This approach visualizes constructive and destructive interference patterns in real time.
- **Continuous Plotting:** Rolling telemetry buffers store the history of simulated variables, plotting them using smooth Bezier interpolation to ensure clean, continuous graphs even when the frame rate varies.

---

## Section 8: Lab Module Reference Sheets

This quick-reference matrix links the physical concepts covered in the platform to their governing mathematical formulations and simulation methods.

| Simulation Card | Primary Physical Concept | Governing Equation | Numerical Solver Method | Visual Mapping Technique |
| :--- | :--- | :--- | :--- | :--- |
| **Kinetic Theory** | Microscopic Pressure & Velocity Distributions | $PV = nRT$; $v_{\text{rms}} = \sqrt{\frac{3 k_B T}{m}}$ | Velocity Verlet & Spatial Grid Collisions | Vector velocities & real-time binned histograms |
| **Electric Circuits** | Nodal Potentials & Current Conservation | $\sum I = 0$; $P = I^2 R$ | Modified Nodal Analysis (LU Decomposition) | Glow intensity, directional moving charge dots |
| **Ohm's Law** | Material Resistivity & Scattering | $V = I R$; $\sigma = \frac{n e^2 \tau}{m_e}$ | Linear Newton-Raphson | Lattice vibration amplitude & electron path deflections |
| **Capacitors** | Transient Charging & Dielectric Polarization | $V(t) = V_0(1 - e^{-t/RC})$ | Backward Euler Integration | Field line density & aligning electric dipoles |
| **Magnetic Fields** | Deflection Forces & Magnetic Flux | $\mathbf{F} = q(\mathbf{v} \times \mathbf{B})$ | Runge-Kutta 4th Order (RK4) | Vector streamlines, rotating compasses |
| **Electromagnetic Induction** | Flux Variation & Induced Electromotive Force | $\mathcal{E} = -\frac{d\Phi_B}{dt}$ | Finite-difference flux time derivative | Brightness glow & dual-trace phase graphs |
| **Mirrors** | Geometric Reflection & Image Formation | $\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}$ | 2D Vector ray-tracing intersections | Parametric lines & virtual convergence points |
| **Lenses** | Snell Refraction & Real/Virtual Focus | $n_1 \sin\theta_1 = n_2 \sin\theta_2$ | Transmitted ray vector calculations | Bending ray bundles & focal highlight regions |
| **Diffraction** | Aperture Scattering & Wavelet Superposition | $a \sin\theta = m\lambda$ | 2D Fast Fourier Transform (FFT) | Heatmap intensity grids & Huygens wavefronts |
| **Interference** | Phase Coherence & Superposition | $\Delta y = \frac{\lambda L}{d}$ | Wave superposition calculation | Interference fringes & rolling intensity plots |
| **Photoelectric Effect** | Energy Quantization & Stopping Potentials | $KE_{\text{max}} = hf - \Phi$ | Monte Carlo particle emission probability | Photon packets & ejected photoelectron vectors |
| **Atomic Models** | Quantized Energy Levels & Transitions | $E_n = -\frac{13.6}{n^2}\text{ eV}$ | Hydrogenic Schrödinger eigenvalues | Orbital wavefunctions & emission spectrum lines |
| **Radioactivity** | Exponential Nuclear Decay Chain | $N(t) = N_0 e^{-\lambda t}$ | Monte Carlo decay step simulation | Color-shifting nuclei & decay particle animations |
| **Quantum Effects** | Wavefunction Tunneling & Probability | $\Delta x \Delta p \ge \frac{\hbar}{2}$ | Crank-Nicolson unitary solver | Wavefunction amplitude curves & tunneling animations |
| **Semiconductor Logic** | P-N Barrier & Transistor Gate Switching | $I = I_0 \left( e^{\frac{qV}{\eta k_B T}} - 1\right)$ | Poisson-Drift-Diffusion finite difference | Charge carrier diffusion & gate switching timelines |
