import ShaderCanvas from "./ShaderCanvas";

/**
 * Flowing gradient shader for the closing Contact segment — smooth drifting
 * bands of accent + dark, calm and premium (a "cool ending"). Original GLSL.
 */
const FLOW_FRAG = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
  uniform vec3 uAccent;

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    float t = iTime * 0.15;

    // stacked flowing sine bands
    float f = 0.0;
    f += sin(uv.x * 3.0 + t * 1.3 + sin(uv.y * 2.0 + t));
    f += sin(uv.y * 2.5 - t * 1.1 + cos(uv.x * 3.5 - t));
    f += sin((uv.x + uv.y) * 2.0 + t * 1.7);
    f = f / 3.0;

    // mouse warps the field
    vec2 m = (iMouse - 0.5 * iResolution.xy) / iResolution.y;
    f += smoothstep(0.6, 0.0, distance(uv, m)) * 0.4;

    float band = 0.5 + 0.5 * sin(f * 3.1415 + t);

    vec3 base = vec3(0.03, 0.02, 0.04);
    vec3 col = mix(base, uAccent, smoothstep(0.2, 0.9, band));
    // subtle bright crest
    col += vec3(1.0, 0.9, 0.95) * smoothstep(0.92, 1.0, band) * 0.4;

    // gentle vignette
    col *= 1.0 - 0.35 * length(uv);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function FlowShader({ className }: { className?: string }) {
  return <ShaderCanvas fragmentShader={FLOW_FRAG} className={className} />;
}
