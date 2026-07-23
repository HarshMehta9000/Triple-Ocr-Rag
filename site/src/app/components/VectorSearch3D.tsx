"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Pt {
  pos: [number, number, number];
  cluster: number;
  label: string;
}

// Blue→teal sequential ramp: one cohesive, professional family.
const CLUSTERS = [
  {
    name: "Healthcare", color: "#4338ca",
    center: [-4.0, 2.2, -1.0] as [number, number, number],
    labels: ["CPT 99213", "ICD-10 E11.9", "denied: medical necessity", "EOB $240", "prior auth on file", "in-network", "deductible met", "EOB patient owes $0"],
  },
  {
    name: "Insurance", color: "#2563eb",
    center: [3.6, 2.6, -1.6] as [number, number, number],
    labels: ["exclusion: flood", "endorsement 7", "sublimit $10k", "named insured", "waiting period 30d", "rider added", "covered peril", "deductible $1,000"],
  },
  {
    name: "Mortgage", color: "#0ea5e9",
    center: [-3.2, -2.6, 1.6] as [number, number, number],
    labels: ["7.25% APR", "30-year fixed", "P&I $1,920", "rate lock 60d", "no prepay penalty", "LTV 78%", "escrow $410", "PMI removed"],
  },
  {
    name: "Finance", color: "#06b6d4",
    center: [3.0, -2.2, 1.9] as [number, number, number],
    labels: ["revenue $4.2B", "YoY +12%", "EPS $1.84", "guidance raised", "gross margin 61%", "segment: cloud", "10-K risk factor", "Q3 transcript"],
  },
  {
    name: "Legal / contracts", color: "#0d9488",
    center: [0.0, 0.4, -3.8] as [number, number, number],
    labels: ["governing law: DE", "indemnification clause", "term: 36 months", "termination for cause", "limitation of liability", "confidentiality", "force majeure", "assignment consent"],
  },
];

const QUERIES: { key: string; q: string; pos: [number, number, number]; domain: number; ans: string }[] = [
  { key: "health", q: "Is this procedure covered?", pos: [-3.6, 2.0, -0.6], domain: 0, ans: "Covered. CPT 99213, in-network, deductible met (Sources 1, 2)." },
  { key: "insurance", q: "What's excluded under the policy?", pos: [3.3, 2.4, -1.2], domain: 1, ans: "Flood is excluded; $10k sublimit applies (Sources 1, 3)." },
  { key: "mortgage", q: "What's the rate and term?", pos: [-2.9, -2.3, 1.3], domain: 2, ans: "7.25% APR, 30-year fixed (Sources 1, 2)." },
  { key: "finance", q: "How did revenue trend?", pos: [2.7, -1.9, 1.6], domain: 3, ans: "$4.2B revenue, +12% YoY (Sources 1, 2)." },
  { key: "books", q: "Governing law and term?", pos: [0.2, 0.5, -3.4], domain: 4, ans: "Governing law is Delaware; 36-month term (Sources 1, 3)." },
];

function buildPoints(): Pt[] {
  const rand = mulberry32(7);
  const pts: Pt[] = [];
  CLUSTERS.forEach((c, ci) => {
    const per = 30;
    for (let i = 0; i < per; i++) {
      const r = 0.4 + rand() * 1.5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      pts.push({
        pos: [
          c.center[0] + r * Math.sin(phi) * Math.cos(theta),
          c.center[1] + r * Math.sin(phi) * Math.sin(theta),
          c.center[2] + r * Math.cos(phi),
        ],
        cluster: ci,
        label: c.labels[i % c.labels.length],
      });
    }
  });
  return pts;
}

const tmp = new THREE.Vector3();

function RetrievalSphere({ position, radius }: { position: [number, number, number]; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const s = 1 + Math.sin(performance.now() * 0.002) * 0.02;
    ref.current.scale.setScalar(radius * s);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#d97706" transparent opacity={0.06} wireframe />
    </mesh>
  );
}

function Scene({
  points, queryIdx, retrieved,
}: {
  points: Pt[]; queryIdx: number; retrieved: number[];
}) {
  const group = useRef<THREE.Group>(null);
  const query = useRef<THREE.Mesh>(null);
  const target = QUERIES[queryIdx];
  const retrievedSet = useMemo(() => new Set(retrieved), [retrieved]);

  // radius enclosing the top-k (max distance to retrieved)
  const radius = useMemo(() => {
    if (retrieved.length === 0) return 0.6;
    let max = 0;
    for (const i of retrieved) {
      const d = Math.hypot(
        points[i].pos[0] - target.pos[0],
        points[i].pos[1] - target.pos[1],
        points[i].pos[2] - target.pos[2],
      );
      if (d > max) max = d;
    }
    return Math.max(0.6, max + 0.25);
  }, [retrieved, points, target]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.06;
    if (query.current) {
      tmp.set(...target.pos);
      query.current.position.lerp(tmp, Math.min(1, dt * 4));
      const s = 0.18 + Math.sin(performance.now() * 0.004) * 0.02;
      query.current.scale.setScalar(s);
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[8, 8, 8]} intensity={0.7} />
      <pointLight position={[-8, -6, 4]} intensity={0.35} color="#0ea5e9" />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.1} minDistance={7} maxDistance={20} />

      <group ref={group}>
        {/* faint reference grid to convey "vector space" */}
        <gridHelper args={[24, 24, "#1e293b", "#1e293b"]} position={[0, -5, 0]} />

        {points.map((p, i) => {
          const hit = retrievedSet.has(i);
          const color = CLUSTERS[p.cluster].color;
          return (
            <mesh key={i} position={p.pos}>
              <sphereGeometry args={[hit ? 0.12 : 0.055, 14, 14]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={hit ? 1.0 : 0.2}
                transparent
                opacity={hit ? 1 : 0.38}
              />
            </mesh>
          );
        })}

        {retrieved.map((i) => (
          <Line key={`l-${i}`} points={[target.pos, points[i].pos]} color="#f59e0b" lineWidth={1.4} transparent opacity={0.65} />
        ))}

        <RetrievalSphere position={target.pos} radius={radius} />

        {/* query vector */}
        <mesh ref={query} position={target.pos}>
          <sphereGeometry args={[1, 28, 28]} />
          <meshStandardMaterial color="#ffffff" emissive="#d97706" emissiveIntensity={1.5} />
        </mesh>

        {CLUSTERS.map((c) => (
          <Html key={c.name} position={[c.center[0], c.center[1] + 2.0, c.center[2]]} center style={{ pointerEvents: "none" }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, color: c.color,
              background: "rgba(8,10,16,0.6)", padding: "2px 8px", borderRadius: 999,
              whiteSpace: "nowrap", backdropFilter: "blur(4px)", letterSpacing: "0.02em",
            }}>
              {c.name}
            </div>
          </Html>
        ))}
      </group>
    </>
  );
}

export default function VectorSearch3D() {
  const points = useMemo(buildPoints, []);
  const [queryIdx, setQueryIdx] = useState(0);
  const [retrieved, setRetrieved] = useState<number[]>([]);
  const [searching, setSearching] = useState(false);

  function runSearch(i: number) {
    setQueryIdx(i);
    setSearching(true);
    const target = QUERIES[i].pos;
    const ranked = points
      .map((p, idx) => ({
        idx,
        d: Math.hypot(p.pos[0] - target[0], p.pos[1] - target[1], p.pos[2] - target[2]),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map((x) => x.idx);
    setTimeout(() => {
      setRetrieved(ranked);
      setSearching(false);
    }, 380);
  }

  const target = QUERIES[queryIdx];
  const retrievedPts = retrieved.map((i) => ({
    label: points[i].label,
    cluster: points[i].cluster,
    d: Math.hypot(
      points[i].pos[0] - target.pos[0],
      points[i].pos[1] - target.pos[1],
      points[i].pos[2] - target.pos[2],
    ),
  }));

  return (
    <section id="vector" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Interactive · drag to orbit</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Vector retrieval, accurately</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Each dot is a document chunk positioned by its embedding. Semantically similar
          chunks sit near each other and cluster by domain. Ask a question; its embedding
          lands in space, and the retriever returns the nearest neighbors it will hand to
          the generator.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <div className="card relative overflow-hidden p-0 lg:col-span-3">
          <div className="h-[380px] w-full sm:h-[480px]">
            <Canvas camera={{ position: [0, 3, 14], fov: 45 }} dpr={[1, 2]}>
              <color attach="background" args={["#070a10"]} />
              <Scene points={points} queryIdx={queryIdx} retrieved={retrieved} />
            </Canvas>
          </div>
          {/* legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-black/40 px-3 py-2 backdrop-blur">
            {CLUSTERS.map((c) => (
              <span key={c.name} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-alert" /> query
            </span>
          </div>
        </div>

        <div className="card flex flex-col gap-4 p-5 lg:col-span-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Ask</p>
            <p className="font-medium">{target.q}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUERIES.map((qq, i) => (
              <button
                key={qq.key}
                onClick={() => runSearch(i)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                  queryIdx === i
                    ? "bg-primary text-white shadow"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                }`}
              >
                {CLUSTERS[qq.domain].name}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">Retrieved · nearest 5</p>
              {searching && <span className="text-xs text-accent">searching…</span>}
            </div>
            {retrievedPts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400 dark:border-white/10">
                Pick a question to embed and retrieve.
              </p>
            ) : (
              <ul className="space-y-2">
                {retrievedPts.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/50 p-2 text-sm dark:border-white/10 dark:bg-white/5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CLUSTERS[p.cluster].color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-200">[{i + 1}]</span>
                    <span className="flex-1 text-slate-600 dark:text-slate-300">{p.label}</span>
                    <span className="font-mono text-[11px] text-slate-400">d={p.d.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-auto rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Grounded answer</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
              {retrieved.length ? target.ans : "No answer yet"}
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Distances are true Euclidean nearest-neighbor over synthetic embeddings. A
            production system uses dense vectors (BGE / E5) in a FAISS / HNSW ANN index,
            often fused with BM25.
          </p>
        </div>
      </div>
    </section>
  );
}
