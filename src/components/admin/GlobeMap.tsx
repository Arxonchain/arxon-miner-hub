import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface CountryData {
  code: string;
  name: string;
  flag: string;
  miners: number;
  color: string;
  lat: number;
  lng: number;
}

const COUNTRIES: CountryData[] = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬", miners: 6325, color: "#22c55e", lat: 9.08, lng: 8.67 },
  { code: "GH", name: "Ghana", flag: "🇬🇭", miners: 1145, color: "#eab308", lat: 7.95, lng: -1.02 },
  { code: "KE", name: "Kenya", flag: "🇰🇪", miners: 923, color: "#14b8a6", lat: -0.02, lng: 37.91 },
  { code: "US", name: "United States", flag: "🇺🇸", miners: 855, color: "#3b82f6", lat: 37.09, lng: -95.71 },
  { code: "IN", name: "India", flag: "🇮🇳", miners: 728, color: "#f97316", lat: 20.59, lng: 78.96 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", miners: 586, color: "#ef4444", lat: 55.38, lng: -3.44 },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", miners: 494, color: "#8b5cf6", lat: -30.56, lng: 22.94 },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", miners: 423, color: "#06b6d4", lat: 7.37, lng: 12.35 },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", miners: 331, color: "#ec4899", lat: -6.37, lng: 34.89 },
  { code: "PH", name: "Philippines", flag: "🇵🇭", miners: 290, color: "#f59e0b", lat: 12.88, lng: 121.77 },
  { code: "CA", name: "Canada", flag: "🇨🇦", miners: 225, color: "#10b981", lat: 56.13, lng: -106.35 },
  { code: "AE", name: "UAE", flag: "🇦🇪", miners: 189, color: "#6366f1", lat: 23.42, lng: 53.85 },
  { code: "DE", name: "Germany", flag: "🇩🇪", miners: 154, color: "#e11d48", lat: 51.17, lng: 10.45 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", miners: 121, color: "#d946ef", lat: -14.24, lng: -51.93 },
  { code: "EG", name: "Egypt", flag: "🇪🇬", miners: 112, color: "#0ea5e9", lat: 26.82, lng: 30.80 },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", miners: 100, color: "#84cc16", lat: 30.38, lng: 69.35 },
];

const RADIUS = 2;

function latLngToVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

/* ── Pulsing ring around each flag marker ── */
function PulseRing({ color, active }: { color: string; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !mat.current) return;
    if (active) {
      const t = (clock.getElapsedTime() * 2) % 1;
      ref.current.scale.setScalar(1 + t * 1.8);
      mat.current.opacity = 0.7 * (1 - t);
    } else {
      ref.current.scale.setScalar(0);
      mat.current.opacity = 0;
    }
  });

  return (
    <mesh ref={ref} rotation={[0, 0, 0]}>
      <ringGeometry args={[0.06, 0.09, 32]} />
      <meshBasicMaterial ref={mat} color={color} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ── Single country marker on the globe surface ── */
function CountryMarker({ country, index, activeIndex }: {
  country: CountryData;
  index: number;
  activeIndex: number;
}) {
  const pos = useMemo(() => latLngToVec3(country.lat, country.lng, RADIUS + 0.02), [country]);
  const isActive = activeIndex === index;
  const dotRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (glowRef.current) {
      glowRef.current.intensity = isActive ? 2.5 : 0;
    }
    if (dotRef.current) {
      dotRef.current.scale.setScalar(isActive ? 1.6 : 1);
    }
  });

  return (
    <group position={pos}>
      {/* Core dot */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={country.color} />
      </mesh>

      {/* Pulse ring */}
      <PulseRing color={country.color} active={isActive} />

      {/* Point light glow */}
      <pointLight ref={glowRef} color={country.color} intensity={0} distance={0.8} />

      {/* Flag label — only visible when active */}
      <Html
        distanceFactor={6}
        style={{
          pointerEvents: "none",
          opacity: isActive ? 1 : 0.35,
          transition: "opacity 0.4s ease",
          transform: "translate(-50%, -100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            filter: isActive ? `drop-shadow(0 0 8px ${country.color})` : "none",
            transition: "filter 0.4s ease",
          }}
        >
          <span style={{ fontSize: isActive ? 22 : 14, transition: "font-size 0.3s ease" }}>
            {country.flag}
          </span>
          {isActive && (
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.8)",
                fontWeight: 700,
                letterSpacing: 1,
                whiteSpace: "nowrap",
                background: "rgba(0,0,0,0.6)",
                padding: "1px 6px",
                borderRadius: 4,
                border: `1px solid ${country.color}44`,
              }}
            >
              {country.code}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

/* ── Rotating Earth ── */
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/images/earth-dark.png");

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        transparent
        emissive="#0a1e3d"
        emissiveIntensity={0.6}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

/* ── Atmosphere halo ── */
function Atmosphere() {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.29, 0.62, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
  }, []);

  return (
    <mesh material={mat}>
      <sphereGeometry args={[RADIUS * 1.15, 64, 64]} />
    </mesh>
  );
}

/* ── Globe scene with markers ── */
function GlobeScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Cycle through countries sequentially
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % COUNTRIES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Slow auto-rotate the whole group (flags rotate with earth)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.4} color="#4a9eff" />

      <Atmosphere />

      <group ref={groupRef}>
        <Earth />
        {COUNTRIES.map((c, i) => (
          <CountryMarker key={c.code} country={c} index={i} activeIndex={activeIndex} />
        ))}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </>
  );
}

/* ── Exported component ── */
export default function GlobeMap() {
  return (
    <div className="w-full aspect-square max-h-[520px] relative">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <GlobeScene />
      </Canvas>

      {/* Active country indicator ring */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
        {COUNTRIES.map((c, i) => (
          <ActiveDot key={c.code} color={c.color} index={i} />
        ))}
      </div>
    </div>
  );
}

function ActiveDot({ color, index }: { color: string; index: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Math.floor((Date.now() / 1800) % COUNTRIES.length);
      setActive(current === index);
    }, 200);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div
      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
      style={{
        background: active ? color : "rgba(255,255,255,0.15)",
        boxShadow: active ? `0 0 8px ${color}` : "none",
        transform: active ? "scale(1.5)" : "scale(1)",
      }}
    />
  );
}
