import React, { useEffect, useRef } from 'react';

const LoginBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sync the WebGL drawing-buffer size with the CSS-driven layout size.
    function syncSize() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    window.addEventListener('resize', syncSize);
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      // Noise function for fluid motion
      float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
          vec2 uv = v_texCoord;
          
          // Liquid metal colors: deep onyx, electric blue, purple, teal
          vec3 color1 = vec3(0.07, 0.07, 0.07); // Surface (Liquid Onyx)
          vec3 color2 = vec3(0.0, 0.6, 0.8);    // Teal/Blue
          vec3 color3 = vec3(0.4, 0.0, 0.6);    // Purple
          
          // Fluid distortion
          vec2 p = uv * 3.0;
          float n = smoothNoise(p + u_time * 0.2);
          n += 0.5 * smoothNoise(p * 2.0 - u_time * 0.1);
          
          // Create "river" flow effect
          float flow = sin(uv.x * 2.0 + u_time + n * 4.0) * 0.5 + 0.5;
          
          // Mixing colors based on noise and flow
          vec3 color = mix(color1, color2, flow * 0.4);
          color = mix(color, color3, n * 0.3);
          
          // Add specular highlights for "liquid" look
          float highlight = pow(max(0.0, 1.0 - length(uv - 0.5 + n * 0.1)), 10.0);
          color += highlight * 0.2;

          gl_FragColor = vec4(color, 1.0);
      }
    `;

    function cs(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vShader = cs(gl.VERTEX_SHADER, vs);
    const fShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!vShader || !fShader) return;

    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let animationFrameId: number;

    function render(t: number) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', syncSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-bg-canvas" />;
};

export default LoginBackground;
