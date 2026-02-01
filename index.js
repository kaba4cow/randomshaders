const VERTEX_SOURCE = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SOURCE = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float t;
out vec4 fragColor;
void main() {
    float x = 2.0 * gl_FragCoord.x / resolution.x - 1.0;
    float y = 2.0 * gl_FragCoord.y / resolution.y - 1.0;
    fragColor.r = $;
    fragColor.g = $;
    fragColor.b = $;
    fragColor.a = 1.0;
}`;

const PARAMETERS = Object.freeze([
    'x',
    'y',
    't'
]);

function getRandomParameter() {
    const index = Math.floor(Math.random() * PARAMETERS.length);

    return PARAMETERS[index];
}

const EXPRESSIONS = Object.freeze([
    '$',
    '$ + $',
    '$ + $ + $',
    '$ - $',
    '$ - $ - $',
    '$ * $',
    '$ * $ * $',
    'abs($)',
    'round($)',
    'pow($, 2.0)',
    'exp($)',
    'sqrt(max($, 0.001))',
    'sin($)',
    'cos($)',
    'length(vec2($, $))',
    'length(vec3($, $, $))',
    'distance(vec2($, $), vec2($, $))',
    'distance(vec3($, $, $), vec3($, $, $))',
    'dot(vec2($, $), vec2($, $))',
    'dot(vec3($, $, $), vec3($, $, $))',
    'cross(vec3($, $, $), vec3($, $, $)).x',
    'normalize(vec2($, $)).x',
    'normalize(vec3($, $, $)).x',
    'clamp($, 0.0, 1.0)',
    'fract($)',
    'mix($, $, $)',
    'smoothstep(0.0, 1.0, clamp($, 0.0, 1.0))',
]);

function getRandomExpression() {
    const index = Math.floor(Math.random() * EXPRESSIONS.length);

    return EXPRESSIONS[index];
}

const canvas = document.getElementById("canvas");
canvas.width = 512;
canvas.height = 512;
const gl = canvas.getContext("webgl2");

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);

        return null;
    }

    return shader;
}

function createProgram(vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);

        return null;
    }

    return program;
}

const quadVertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
]);

const vao = gl.createVertexArray();
const vbo = gl.createBuffer();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

let program = null;
let uniformResolution = null;
let uniformTime = null;
let startTime = performance.now();

function initShader() {
    if (program) {
        gl.deleteProgram(program);
    }
    const fragmentSource = FRAGMENT_SOURCE.replace(/\$/g, generateFunction);
    program = createProgram(VERTEX_SOURCE, fragmentSource);
    if (program) {
        uniformResolution = gl.getUniformLocation(program, "resolution");
        uniformTime = gl.getUniformLocation(program, "t");
    }
}

function render() {
    if (!program) {
        return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform2f(uniformResolution, canvas.width, canvas.height);
    gl.uniform1f(uniformTime, Math.cos((performance.now() - startTime) / 1000.0));
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}

function reset() {
    startTime = performance.now();
    initShader();
}

function generateFunction() {
    const depth = 6;
    const dataSource = generateDataSource(depth);
    console.log(dataSource);

    return dataSource;
}

function generateDataSource(depth) {
    if (depth > 0) {
        return getRandomExpression().replace(/\$/g, () => generateDataSource(depth - 1));
    } else {
        return getRandomParameter();
    }
}

document.getElementById("reset-button").addEventListener("click", reset);

reset();
render();