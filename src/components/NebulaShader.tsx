import ShaderCanvas from "./ShaderCanvas";

/**
 * Quantum-nebula style background: layered FBM noise drifting slowly, tinted
 * toward the brand accent with cool counter-tones, plus a soft mouse-follow
 * bloom. Original GLSL (inspired by nebula shaders, not copied).
 */
const NEBULA_FRAG = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
  uniform vec3 uAccent;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = p * 2.0 + vec2(37.0, 17.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

    float t = iTime * 0.06;
    vec2 q = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 - t + 5.2));
    float clouds = fbm(p * 2.0 + q * 2.0 + vec2(t, -t));

    // color: deep space base -> accent -> cool counter-tone highlights
    vec3 base = vec3(0.02, 0.02, 0.05);
    vec3 cool = vec3(0.15, 0.35, 0.9);
    vec3 col = mix(base, uAccent, smoothstep(0.35, 0.85, clouds));
    col = mix(col, cool, smoothstep(0.75, 1.0, clouds) * 0.6);

    // starfield sparkle
    float stars = pow(hash(floor(gl_FragCoord.xy * 0.5)), 40.0);
    col += stars * 0.8;

    // mouse bloom
    vec2 m = iMouse / iResolution.xy;
    float d = distance(uv, m);
    col += uAccent * smoothstep(0.35, 0.0, d) * 0.25;

    // vignette
    col *= 1.0 - 0.5 * length(p);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function NebulaShader({ className }: { className?: string }) {
  return <ShaderCanvas fragmentShader={NEBULA_FRAG} className={className} />;
}
