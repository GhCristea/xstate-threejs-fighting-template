// import * as THREE from 'three'

export const VHSShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    distortion: { value: 3.0 },
    distortion2: { value: 5.0 },
    speed: { value: 0.2 },
    rollSpeed: { value: 0.1 },
    scanlines: { value: 0.2 },
    staticIntensity: { value: 0.05 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float distortion;
    uniform float distortion2;
    uniform float speed;
    uniform float rollSpeed;
    uniform float scanlines;
    uniform float staticIntensity;
    varying vec2 vUv;

    // Random function for noise
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // VHS distortion lines
      float ty = time * speed;
      float yt = uv.y - ty;
      float offset = random(vec2(yt * 0.01, ty * 0.01)) * 0.01;
      offset += random(vec2(yt * 2.0, ty * 0.5)) * distortion * 0.001;

      // Rolling effect
      float roll = sin(uv.y * 10.0 - time * rollSpeed) * 0.01;
      uv.x += offset + roll;

      // Chromatic aberration
      float r = texture2D(tDiffuse, uv + vec2(0.002, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(0.002, 0.0)).b;

      vec3 color = vec3(r, g, b);

      // Scanlines
      float scanline = sin(uv.y * 800.0) * scanlines;
      color -= scanline * 0.1; // Reduced intensity of darkening

      // Static noise
      float noise = random(uv + vec2(time)) * staticIntensity;
      color += noise;

      // Vignette
      float vignette = smoothstep(1.5, 0.5, length(uv - 0.5));
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `
}
