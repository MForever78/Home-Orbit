var gl;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var rCube = 0;
var shaderProgram;
var dogeTexture;
var textures = [];
var textureSource = ["img/doge.png", "img/floor.png"];
var currentlyPressedKeys = {};
var eye = [0, 0, 0];
var center = [0, 0, 0];
var up = [0, 1, 0];

// utils
function mvPushMatrix() {
  var copy = mat4.clone(mvMatrix);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length === 0) {
    throw "Invalid popMatrix";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function handleKeyDown(event) {
  // maintain key status
  currentlyPressedKeys[event.keyCode] = true;

  // handle keys once
}

function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}

// Objects

function Cube(size) {
  this.vertexPositionBuffer = gl.createBuffer();
  this.vertexColorBuffer = gl.createBuffer();
  this.vertexIndexBuffer = gl.createBuffer();
  this.vertexTextureCoordBuffer = gl.createBuffer();
  this.vertexNormalBuffer = gl.createBuffer();

  var halfSize = size.map(function(element) {
    return element / 2.0;
  });

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
  var vertices = [
    // Front
    -halfSize[0], -halfSize[1], halfSize[2],
    halfSize[0], -halfSize[1], halfSize[2],
    halfSize[0], halfSize[1], halfSize[2],
    -halfSize[0], halfSize[1], halfSize[2],

    // Back
    -halfSize[0], -halfSize[1], -halfSize[2],
    -halfSize[0], halfSize[1], -halfSize[2],
    halfSize[0], halfSize[1], -halfSize[2],
    halfSize[0], -halfSize[1], -halfSize[2],
    
    // Top
    -halfSize[0], halfSize[1], -halfSize[2],
    -halfSize[0], halfSize[1], halfSize[2],
    halfSize[0], halfSize[1], halfSize[2],
    halfSize[0], halfSize[1], -halfSize[2],

    // Bottom
    -halfSize[0], -halfSize[1], -halfSize[2],
    halfSize[0], -halfSize[1], -halfSize[2],
    halfSize[0], -halfSize[1], halfSize[2],
    -halfSize[0], -halfSize[1], halfSize[2],

    // Right
    halfSize[0], -halfSize[1], -halfSize[2],
    halfSize[0], halfSize[1], -halfSize[2],
    halfSize[0], halfSize[1], halfSize[2],
    halfSize[0], -halfSize[1], halfSize[2],

    // Left
    -halfSize[0], -halfSize[1], -halfSize[2],
    -halfSize[0], -halfSize[1], halfSize[2],
    -halfSize[0], halfSize[1], halfSize[2],
    -halfSize[0], halfSize[1], -halfSize[2]
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  this.vertexPositionBuffer.itemSize = 3;
  this.vertexPositionBuffer.numItems = 24;

  // texture
  this.vertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
  var textureCoords = [
    // Front
    0.0, 0.0,
    size[0], 0.0,
    size[0], size[1],
    0.0, size[1],

    // Back
    size[0], 0.0,
    size[0], size[1],
    0.0, size[1],
    0.0, 0.0,

    // Top
    0.0, size[2],
    0.0, 0.0,
    size[0], 0.0,
    size[0], size[2],

    // Bottom
    size[0], size[2],
    0.0, size[2],
    0.0, 0.0,
    size[0], 0.0,

    // Right
    size[2], 0.0,
    size[2], size[1],
    0.0, size[1],
    0.0, 0.0,

    // Left
    0.0, 0.0,
    size[2], 0.0,
    size[2], size[1],
    0.0, size[1],
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  this.vertexTextureCoordBuffer.itemSize = 2;
  this.vertexTextureCoordBuffer.numItems = 24;

  // index
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
  var cubeVertexIndices = [
    0, 1, 2,    0, 2, 3,
    4, 5, 6,    4, 6, 7,
    8, 9, 10,   8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  this.vertexIndexBuffer.itemSize = 1;
  this.vertexIndexBuffer.numItems = 36;

  // normal
  // used to reflect light
  this.vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
  var vertexNormals = [
    // Front
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    // Back
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,

    // Top
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    // Bottom
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,

    // Right
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,

    // Left
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  this.vertexNormalBuffer.itemSize = 3;
  this.vertexNormalBuffer.numItems = 24;
}

function webGLStart() {
  var canvas = document.getElementById("main-frame");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initGL(canvas);
  initShaders();
  initBuffers();
  initTextures();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  
  tick();
}

function tick() {
  window.requestAnimationFrame(tick);
  handleKeys();
  drawScene();
  animate();
}

function handleKeys() {
  // handle keys per tick
  var direction = 0;
  if (currentlyPressedKeys[87]) {
    // w
    eye[2] -= 0.1;
  }
  if (currentlyPressedKeys[83]) {
    // s
    eye[2] += 0.1;
  }
}

var lastTime = 0;
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = new Date().getTime();
    rCube += 1;
  }
  lastTime = timeNow;
}

function initTextures() {
  textureSource.forEach(function(src) {
    var tex = gl.createTexture();
    textures.push(tex);
    tex.image = new Image();
    tex.image.onload = function() {
      handleLoadedTexture(tex);
    }
    tex.image.src = src;
  });
}

function handleLoadedTexture(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {
    alert("not support webGL!");
  }
    
  if (!gl) {
    alert("cannot load WebGL.");
  }
}

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("cannot init shaders.");
  }

  gl.useProgram(shaderProgram);
  
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
  shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
  shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
  shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript)
    return null;
  
  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType === 3)
      str += k.textContent;
    k = k.nextSibling;
  }
  
  var shader;
  if (shaderScript.type === "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type === "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  
  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function initBuffers() {
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat3.normalFromMat4(normalMatrix, mvMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // always use lighting, for now
  // maybe use a key to toggle in the future
  var lighting = true;
  gl.uniform1i(shaderProgram.useLightingUniform, lighting);
  if (lighting) {
    // use white light as default
    gl.uniform3f(shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
    
    var lightingDirection = [0.0, -1.0, 0.0];
    var adjustedLD = vec3.create();
    // scale its length to one
    vec3.normalize(adjustedLD, lightingDirection);
    vec3.scale(adjustedLD, adjustedLD, -1);
    gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
    gl.uniform3f(shaderProgram.directionalColorUniform, 1.0, 1.0, 1.0);
  }

  // set the look view
  mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
  mat4.lookAt(mvMatrix, eye, center, up);

  /*
   * Floor
   */
  
  var floor = new Cube([20.0, 0.2, 20.0]);
  mvPushMatrix();
  mat4.translate(mvMatrix, mvMatrix, [0, -1.0, 0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, floor.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // normal
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.vertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, floor.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // texture
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.vertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, floor.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, floor.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  mvPopMatrix();

  /*
   * Cube
   */

  var cube = new Cube([1.0, 1.0, 1.0]);

  mvPushMatrix();
  mat4.translate(mvMatrix, mvMatrix, [0.0, 1.0, -5.0]);
  mat4.rotate(mvMatrix, mvMatrix, degToRad(rCube), vec3.fromValues(1, 1, 1));
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cube.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // normal
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cube.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // texture
  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cube.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  // index
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cube.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();
}

window.onload = webGLStart;

