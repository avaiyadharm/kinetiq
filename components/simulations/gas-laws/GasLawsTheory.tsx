"use client";

import React, { useState } from "react";
import { BookOpen, Activity, Box, Variable, Layers, Cpu, CheckCircle2, XCircle, HelpCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Scientific Typography Components
const Sub = ({ children }: { children: React.ReactNode }) => <sub className="text-[0.7em] relative bottom-[-0.3em] font-serif">{children}</sub>;
const Sup = ({ children }: { children: React.ReactNode }) => <sup className="text-[0.7em] relative top-[-0.3em] font-serif">{children}</sup>;

const MathEq = ({ children, block = false, label }: { children: React.ReactNode, block?: boolean, label?: string }) => {
  if (!block) {
    return <span className="font-serif italic mx-0.5 text-slate-200 tracking-wide">{children}</span>;
  }
  return (
    <div className="my-8 relative group w-full">
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-black z-10 shadow-sm">{label}</div>}
      <div className="bg-black/40 border border-white/10 rounded-2xl py-8 px-6 flex items-center justify-center overflow-x-auto shadow-inner relative">
        <div className="font-serif text-lg tracking-wider text-white whitespace-nowrap flex items-center gap-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const MathFrac = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
  <span className="inline-flex flex-col items-center justify-center align-middle mx-2 font-serif text-[0.9em] translate-y-[-0.1em]">
    <span className="border-b border-white/60 pb-[3px] mb-[3px] px-1">{num}</span>
    <span className="pt-[1px] px-1">{den}</span>
  </span>
);

const SectionHeader = ({ title, icon: Icon, id }: { title: string, icon: React.ElementType, id?: string }) => (
  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mt-12 mb-6" id={id}>
    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-lg font-black font-display uppercase tracking-widest text-white">{title}</h3>
  </div>
);

const DefItem = ({ term, sym, unit, desc }: { term: string, sym: React.ReactNode, unit: string, desc: string }) => (
  <div className="flex flex-col md:flex-row md:items-baseline gap-3 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-3 rounded-lg transition-colors">
    <div className="md:w-1/3 flex items-baseline gap-2 shrink-0">
      <span className="font-bold text-white/90 text-sm tracking-wide">{term}</span>
      <span className="font-serif italic text-emerald-400 font-bold">{sym}</span>
    </div>
    <div className="md:w-2/3 flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-white/50 bg-white/5 w-fit px-2 py-0.5 rounded uppercase tracking-widest border border-white/5">{unit}</span>
      <span className="text-sm text-white/60 leading-relaxed">{desc}</span>
    </div>
  </div>
);

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Under isothermal conditions (constant Temperature), if the volume of the gas chamber is compressed to half its initial size, what happens to the measured pressure?",
    options: [
      "The pressure remains constant.",
      "The pressure is reduced to half its initial value.",
      "The pressure doubles.",
      "The pressure increases exponentially by a factor of 4."
    ],
    answer: 2,
    explanation: "According to Boyle's Law (P ∝ 1/V), at constant temperature and particle count, pressure is inversely proportional to volume. Reducing volume by half doubles the particle density and wall collision frequency, thereby doubling the measured pressure."
  },
  {
    id: 2,
    question: "In statistical mechanics, Shannon Entropy S reaches its absolute maximum when particle positions are distributed in which way?",
    options: [
      "All particles are localized in a single grid cell (lowest volume state).",
      "Particles are distributed completely uniformly across all grid cells.",
      "Blue species are segregated to the left, and orange species to the right.",
      "Particles are settled at the bottom of the container due to gravity."
    ],
    answer: 1,
    explanation: "Shannon Entropy measures spatial uncertainty/disorder. When particles are distributed completely uniformly across the container, the probability of finding a particle in any cell is equal (P_i = 1/M^2). This maximum disorder corresponds to the thermodynamic state of maximum entropy, S = ln(M^2)."
  },
  {
    id: 3,
    question: "How does the co-volume constant 'b' in the Van der Waals equation affect the pressure of a real gas compared to an ideal gas at equivalent temperatures?",
    options: [
      "It increases pressure because the effective volume available for particles to move is reduced.",
      "It decreases pressure because it increases electrostatic attractions.",
      "It decreases pressure because it slows down the particles.",
      "It has no effect on pressure unless the temperature reaches absolute zero."
    ],
    answer: 0,
    explanation: "The co-volume parameter 'b' accounts for the finite size of particles. In a container of volume V, the actual free space for particles to move is V - nb. Since particles have less free space, their frequency of wall collisions increases, raising the measured pressure."
  },
  {
    id: 4,
    question: "Why does temperature affect the width and height of the Maxwell-Boltzmann velocity distribution curve?",
    options: [
      "Higher temperature increases molecular mass, shifting the peak left.",
      "Higher temperature decreases particle speed, narrowing the curve.",
      "Higher temperature widens the curve and lowers the peak, as particles gain a broader range of high speeds.",
      "Temperature has no effect on the distribution curve in two dimensions."
    ],
    answer: 2,
    explanation: "As temperature increases, the average kinetic energy increases, and particles gain a wider range of possible high velocities. This spreads the probability density curve to the right (broadening it) and, since the total area under the probability density curve must equal 1.0, the peak height shifts down."
  }
];

export const GasLawsTheory: React.FC<{ expertiseLevel: "beginner" | "intermediate" | "expert" }> = ({ expertiseLevel }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    let currentScore = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.answer) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 bg-[#18181b] overflow-y-auto text-white selection:bg-emerald-500/30">
      <div className="max-w-[900px] mx-auto w-full space-y-8 animate-fadeIn pb-32">
        
        {/* Header */}
        <div className="flex flex-col border-b border-white/10 pb-8">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.25em] mb-2">Thermodynamics & Kinetic Theory</div>
          <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-widest text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-400" /> Theoretical Basis of Gas Dynamics
          </h2>
          <div className="flex items-center gap-2 mt-4 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5 text-[9px] uppercase tracking-wider font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-primary" /> Active Syllabus Level: {expertiseLevel}
          </div>
        </div>

        {/* ─── LEVEL 1: BEGINNER CURRICULUM ─────────────────────────────────── */}
        {expertiseLevel === "beginner" && (
          <div className="space-y-6">
            <SectionHeader title="Basic Concepts of Gas Behavior" icon={Activity} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              Gas is one of the states of matter. Unlike solids or liquids, a gas has no fixed shape or volume. It expands to fill whatever container it is put in. Gas is made up of billions of tiny particles moving around very fast in all directions, bouncing off each other and the container walls.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              <div className="bg-black/35 p-5 border border-white/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">Temperature (T)</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  How fast the particles are moving. Hotter gas means particles have more energy and zoom around much faster. Cold gas means they slow down.
                </p>
              </div>
              <div className="bg-black/35 p-5 border border-white/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Volume (V)</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  The amount of physical space inside the container. Compressing the chamber makes the volume smaller; expanding it makes it larger.
                </p>
              </div>
              <div className="bg-black/35 p-5 border border-white/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">Pressure (P)</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  The force of particles hitting the walls. If you squeeze particles into a smaller space or heat them up, they hit the walls harder and more often, raising pressure.
                </p>
              </div>
            </div>

            <SectionHeader title="Everyday Gas Law Examples" icon={Box} />
            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="text-xl font-bold font-mono text-emerald-400 shrink-0">01</div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Bicycle Pump (Boyle's Law)</h4>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">
                    When you push down on a bicycle pump, you are squeezing the air into a smaller space (decreasing volume). Since there is less room, the air particles collide more frequently, causing pressure to increase. Squeezing volume increases pressure.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="text-xl font-bold font-mono text-emerald-400 shrink-0">02</div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Balloon in a Freezer (Charles's Law)</h4>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">
                    If you inflate a balloon and put it in a freezer, it shrinks. The cold temperature slows down the gas particles inside. Because they move slower, they collide with less force, causing the balloon to shrink to keep the pressure equal. Cooling volume decreases size.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="text-xl font-bold font-mono text-emerald-400 shrink-0">03</div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Pressure Cooker (Gay-Lussac's Law)</h4>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">
                    A pressure cooker is a solid container (constant volume). As you heat up the water inside, the gas particles gain energy and bounce around much faster. Since they cannot expand the metal container, they hit the walls harder, causing pressure to climb high. Heating increases pressure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── LEVEL 2: INTERMEDIATE CURRICULUM ────────────────────────────── */}
        {expertiseLevel === "intermediate" && (
          <div className="space-y-6">
            <SectionHeader title="Empirical Gas Formulations" icon={Activity} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              Empirical gas laws map direct and inverse mathematical proportions between the macrostate variables. In these laws, one or more variables are held constant (locked) to study the correlations of the others:
            </p>

            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-6 mb-2">Boyle's Law (P ∝ 1/V)</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              At constant Temperature (T) and particle count (N), the pressure of an ideal gas is inversely proportional to its volume. Squeezing the volume doubles the pressure:
            </p>
            <div className="bg-black/45 border border-white/5 py-4 text-center rounded-xl font-mono text-sm font-bold text-white/90">
              P · V = constant ───&gt; P₁V₁ = P₂V₂
            </div>

            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-6 mb-2">Charles's Law (V ∝ T)</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              At constant Pressure (P) and particle count (N), the volume of an ideal gas is directly proportional to its absolute temperature in Kelvin. Double the heat, double the size:
            </p>
            <div className="bg-black/45 border border-white/5 py-4 text-center rounded-xl font-mono text-sm font-bold text-white/90">
              V / T = constant ───&gt; V₁/T₁ = V₂/T₂
            </div>

            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-6 mb-2">Gay-Lussac's Law (P ∝ T)</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              At constant Volume (V) and particle count (N), pressure is directly proportional to temperature. Heating a fixed container causes wall collisions to become stronger, raising pressure:
            </p>
            <div className="bg-black/45 border border-white/5 py-4 text-center rounded-xl font-mono text-sm font-bold text-white/90">
              P / T = constant ───&gt; P₁/T₁ = P₂/T₂
            </div>

            <SectionHeader title="Unified Ideal Gas Equation" icon={Variable} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              Combining all empirical ratios yields the unified ideal gas equation of state:
            </p>
            <div className="bg-black/45 border border-white/5 py-5 text-center rounded-2xl font-mono text-base font-bold text-emerald-400">
              P · V = N · k_B · T
            </div>
            
            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Independent vs Dependent variables</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                When you set a **Gas Law Regime** inside the simulator, you choose which variable is locked:
                <br />
                • In **Boyle's regime**, Temperature is locked. You change Volume, and Pressure behaves as the dependent variable.
                <br />
                • In **Charles's regime**, Pressure is locked. You change Temperature, and the volume expands/contracts automatically to satisfy the equation of state.
              </p>
            </div>
          </div>
        )}

        {/* ─── LEVEL 3: ADVANCED (EXPERT) CURRICULUM ────────────────────────── */}
        {expertiseLevel === "expert" && (
          <div className="space-y-6">
            <SectionHeader title="1. Classical & Statistical Thermodynamics" icon={Cpu} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              The macroscopic state of an ideal gas can be derived from the partition function of a canonical ensemble. Let a system contain <MathEq>{"N"}</MathEq> non-interacting particles of mass <MathEq>{"m"}</MathEq> in a 2D volume <MathEq>{"V"}</MathEq> at temperature <MathEq>{"T"}</MathEq>. The canonical partition function is:
            </p>

            <MathEq block label="Canonical Partition Function">
              {"Z_N(V, T) = \\frac{1}{N! h^{2N}} \\int e^{-\\beta H(p,q)} d^{2N}p \\, d^{2N}q = \\frac{1}{N!} \\left[ V \\left( \\frac{2 \\pi m k_B T}{h^2} \\right) \\right]^N"}
            </MathEq>

            <p className="text-sm text-white/70 leading-relaxed mt-4 font-serif">
              The Helmholtz free energy is given by <MathEq>{"F = -k_B T \\ln Z_N"}</MathEq>. Using Stirling's approximation for <MathEq>{"\\ln N! \\approx N \\ln N - N"}</MathEq>:
            </p>
            <MathEq block>
              {"F = -N k_B T \\left[ \\ln\\left( \\frac{V}{N} \\left( \\frac{2\\pi m k_B T}{h^2} \\right) \\right) + 1 \\right]"}
            </MathEq>
            <p className="text-sm text-white/70 leading-relaxed mt-4 font-serif">
              The macroscopic pressure <MathEq>{"P"}</MathEq> is defined as the negative volume derivative of <MathEq>{"F"}</MathEq>:
            </p>
            <MathEq block label="Equation of State Derivation">
              {"P = -\\left( \\frac{\\partial F}{\\partial V} \\right)_{N,T} = \\frac{N k_B T}{V} \\implies PV = N k_B T"}
            </MathEq>

            <SectionHeader title="2. Kinetic Collision Theory & Pressure" icon={Activity} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              In our custom 2D physics engine, pressure is calculated directly from the elastic wall collision momentum transfers. Consider particles of mass <MathEq>{"m"}</MathEq> colliding with a vertical wall of height <MathEq>{"L_y"}</MathEq>. The momentum transfer per collision is:
            </p>
            <MathEq block>
              {"\\Delta p_x = 2 m |v_{x}|"}
            </MathEq>
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              Integrating over a time period <MathEq>{"\\Delta t"}</MathEq>, the total average force <MathEq>{"F_x"}</MathEq> on the wall is the sum of momentum transfers divided by time. The pressure is the force per unit boundary perimeter <MathEq>{"L"}</MathEq>:
            </p>
            <MathEq block label="Mechanical Pressure Integration">
              {"P = \\frac{\\sum_i 2 m |v_{x,i}|}{L \\cdot \\Delta t}"}
            </MathEq>
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              This momentum accumulator computes the simulated pressure telemetry live on canvas, exhibiting shot noise fluctuations at low <MathEq>{"N"}</MathEq>.
            </p>

            <SectionHeader title="3. Maxwell-Boltzmann Speed Distribution in 2D" icon={Layers} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              In a 2D isotropic velocity space, the probability density function for velocity components is Gaussian:
            </p>
            <MathEq block>
              {"f(v_x, v_y) \\, dv_x \\, dv_y = \\left( \\frac{m}{2 \\pi k_B T} \\right) \\exp\\left( - \\frac{m(v_x^2 + v_y^2)}{2 k_B T} \\right) dv_x \\, dv_y"}
            </MathEq>
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              To find the probability of speed <MathEq>{"v = \\sqrt{v_x^2 + v_y^2}"}</MathEq>, we transform to polar coordinates, integrating out the angle component <MathEq>{"d\\theta"}</MathEq> from <MathEq>{"0"}</MathEq> to <MathEq>{"2\\pi"}</MathEq>:
            </p>
            <MathEq block label="2D Maxwell-Boltzmann Probability Density">
              {"f(v) \\, dv = \\int_0^{2\\pi} \\left( \\frac{m}{2 \\pi k_B T} \\right) \\exp\\left( -\\frac{m v^2}{2 k_B T} \\right) v \\, d\\theta \\, dv = \\left( \\frac{m v}{k_B T} \\right) \\exp\\left( -\\frac{m v^2}{2 k_B T} \\right) dv"}
            </MathEq>

            <SectionHeader title="4. Spatial Shannon Entropy" icon={Box} />
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              Dividing the physical coordinates <MathEq>{"[X_{min}, X_{max}] \\times [Y_{min}, Y_{max}]"}</MathEq> into <MathEq>{"M^2"}</MathEq> micro-cells, let <MathEq>{"N_i"}</MathEq> be the particle count in cell <MathEq>{"i"}</MathEq>. The probability of occupancy is <MathEq>{"P_i = N_i / N"}</MathEq>. The spatial Shannon Entropy is computed as:
            </p>
            <MathEq block label="Shannon Entropy Formula">
              {"S = -k_B \\sum_{i=1}^{M^2} P_i \\ln P_i"}
            </MathEq>
            <p className="text-sm text-white/70 leading-relaxed font-serif">
              When particles are initially constrained behind a barrier, they occupy only a fraction of cells, resulting in a low <MathEq>{"S"}</MathEq>. Removing the barrier lets particles expand freely across the phase space grid cells, and <MathEq>{"S"}</MathEq> increases monotonically towards the maximum state of <MathEq>{"\\ln(M^2)"}</MathEq>, demonstrating the Second Law of Thermodynamics.
            </p>
          </div>
        )}

        {/* ─── INTERACTIVE THERMODYNAMIC QUIZ ───────────────────────────────── */}
        <section className="border-t border-white/10 pt-12 mt-16">
          <div className="bg-[#141416] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <HelpCircle className="w-48 h-48" />
            </div>

            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Thermodynamics & Statistical Mechanics Quiz</h3>
                <p className="text-[10px] text-white/40 mt-0.5">Evaluate your understanding of macrostate gas laws and particle kinetics.</p>
              </div>
            </div>

            <div className="space-y-8">
              {QUIZ_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} className="space-y-3">
                  <h4 className="text-xs font-bold text-white/90 leading-relaxed font-mono flex items-start gap-2.5">
                    <span className="text-primary font-bold">{qIdx + 1}.</span>
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5 pl-5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      const isCorrect = q.answer === optIdx;
                      const showFeedback = quizSubmitted;

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between",
                            isSelected 
                              ? "bg-primary/10 border-primary text-white font-bold" 
                              : "bg-black/25 border-white/5 text-white/60 hover:border-white/10 hover:text-white/80",
                            showFeedback && isCorrect && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold",
                            showFeedback && isSelected && !isCorrect && "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          )}
                        >
                          <span>{opt}</span>
                          
                          {showFeedback && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                          )}
                          {showFeedback && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {quizSubmitted && (
                    <div className={cn(
                      "pl-5 pr-4 py-3 rounded-xl text-[10px] leading-relaxed border font-mono mt-2 animate-fadeIn",
                      answers[q.id] === q.answer 
                        ? "bg-emerald-950/20 border-emerald-500/10 text-emerald-300/80" 
                        : "bg-rose-950/20 border-rose-500/10 text-rose-300/80"
                    )}>
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Form actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length}
                  className="px-6 py-3 bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  Submit Evaluation
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Evaluation Completed:</span>
                    <span className={cn(
                      "text-sm font-mono font-black border px-3 py-1 rounded-lg uppercase",
                      score >= 3 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    )}>
                      Score = {score} / {QUIZ_QUESTIONS.length}
                    </span>
                  </div>
                  <button
                    onClick={handleResetQuiz}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-90"
                  >
                    Reset Quiz
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
