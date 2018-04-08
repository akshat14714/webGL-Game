var cubeRotation = 0.0;
var obsRotate = 0.000;

var grayScale = false;

var rotatCoeff = 0.0;

var iniY = 2.5;
var acclr = 0.0;
var speedY = 0.0;
var tunnelSpeed = 0;

var score = 0;

var x1 = 50;

var life = 3;

main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
    precision mediump float;
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;
    uniform float now;
    uniform bool grayScala;

    vec4 toGrayscale(in vec4 color) {
      float average = (color.r + color.g + color.b) / 3.0;
      return vec4(average, average, average, 1.0);

    }


    void main(void) {

      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      if (grayScala == true)
        gl_FragColor = toGrayscale(vec4(texelColor.rgb * vLighting, texelColor.a));

      else
        gl_FragColor = vec4(texelColor.rgb *vLighting, texelColor.a);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      grayScale: gl.getUniformLocation(shaderProgram, 'grayScale'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  const buffersCube = initBuffersObsCube(gl);

  const tunnelTexture = loadTexture(gl, '1.png');
  const obsTexture = loadTexture(gl, 'cubeTexture.jpg');

  // const cubeBuffers = initBuffersObsCube(gl);

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    gl.uniform1i(programInfo.uniformLocations.grayScale, grayScale);

    drawScene(gl, programInfo, buffers, tunnelTexture, deltaTime);
    drawSceneObsCube(gl, programInfo, buffersCube, obsTexture, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//

function initBuffers(gl) {

  // var height = 4.5;
  // var side = (Math.sqrt(2) - 1) * height;

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  // var positions = [
  //   // Front face
  //    side, height,  1.0,
  //   -side, height,  1.0,
  //    side, height, -1.0,
  //   -side, height, -1.0,
  //
  //   // Back face
  //    side, height,  1.0,
  //    height, side,  1.0,
  //    side, height, -1.0,
  //    height, side, -1.0,
  //
  //   // Top face
  //    height, side,  1.0,
  //    height,-side,  1.0,
  //    height, side, -1.0,
  //    height,-side, -1.0,
  //
  //    height,-side,  1.0,
  //    side,-height,  1.0,
  //    height,-side, -1.0,
  //    side,-height, -1.0,
  //
  //    side,-height,  1.0,
  //   -side,-height,  1.0,
  //    side,-height, -1.0,
  //   -side,-height, -1.0,
  //
  //   -side,-height,  1.0,
  //   -height,-side,  1.0,
  //   -side,-height, -1.0,
  //   -height,-side, -1.0,
  //
  //   -height,-side,  1.0,
  //   -height, side,  1.0,
  //   -height,-side, -1.0,
  //   -height, side, -1.0,
  //
  //   -height, side,  1.0,
  //   -side, height,  1.0,
  //   -height, side, -1.0,
  //   -side, height, -1.0,
  // ];
  //
  // for(var i=0;i<999;i++)
  // {
  //   var lenPos = positions.length;
  //   for(var j = 0;j<96;j++)
  //   {
  //     if (j%3 == 2) {
  //       positions[lenPos+j] = positions[j] - 2.0*(i+1);
  //     }
  //     else {
  //       positions[lenPos+j] = positions[j];
  //     }
  //   }
  // }

  const positions = [];

  var diff = Math.PI/4;
  var ang = diff/2.0;

  var k = 0;

  var iniz = 0.0;
  var diffz = -4.0;

  for (var j=0;j<1000;j++) {
    for (var i=0;i<8;i++) {
        positions[k++] = Math.cos(ang) * 5;
        positions[k++] = Math.sin(ang) * 5;
        positions[k++] = iniz;

        positions[k++] = Math.cos(ang+diff) * 5;
        positions[k++] = Math.sin(ang+diff) * 5;
        positions[k++] = iniz;

        positions[k++] = Math.cos(ang) * 5;
        positions[k++] = Math.sin(ang) * 5;
        positions[k++] = iniz+diffz;

        positions[k++] = Math.cos(ang+diff) * 5;
        positions[k++] = Math.sin(ang+diff) * 5;
        positions[k++] = iniz+diffz;

        ang += diff;
    }
    iniz += diffz;
  }

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  // const faceColors1 = [
  //   [1.0,  1.0,  1.0,  1.0],    // Front face: white
  //   [0.0,  0.0,  0.0,  1.0],    // Back face: red
  //   [1.0,  1.0,  1.0,  1.0],    // Top face: green
  //   [0.0,  0.0,  0.0,  1.0],    // Bottom face: blue
  //   [1.0,  1.0,  1.0,  1.0],    // Right face: yellow
  //   [0.0,  0.0,  0.0,  1.0],    // Left face: purple
  //   [1.0,  1.0,  1.0,  1.0],
  //   [0.0,  0.0,  0.0,  1.0],
  // ];
  //
  // const faceColors2 = [
  //   [0.0,  0.0,  0.0,  1.0],    // Front face: white
  //   [1.0,  1.0,  1.0,  1.0],    // Back face: red
  //   [0.0,  0.0,  0.0,  1.0],    // Top face: green
  //   [1.0,  1.0,  1.0,  1.0],    // Bottom face: blue
  //   [0.0,  0.0,  0.0,  1.0],    // Right face: yellow
  //   [1.0,  1.0,  1.0,  1.0],    // Left face: purple
  //   [0.0,  0.0,  0.0,  1.0],
  //   [1.0,  1.0,  1.0,  1.0],
  // ];

  // Convert the array of colors into a table for all the vertices.

  // var colors = [];
  // var flagColor = 0;
  // var bla = 0;

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],
    // Back
    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],
    // Top
    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],
    // Bottom
    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],
    // Right
    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],
    // Left
    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],

    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0],

    [0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0]
  ];

  var colors = [];

  for (var i=0; i<1000; i++) {
    c = textureCoordinates[i%8],
    colors = colors.concat(c, c, c, c);
    // if (i%50==0 && flagColor==0) {
    //   flagColor = 1;
    // }
    // else if (i%50==0 && flagColor==1) {
    //   flagColor = 0;
    // }
    //
    // if (bla == 0) {
    //   bla = 1;
    // }
    // else {
    //   bla = 0;
    // }
    //
    // for (var j = 0; j < faceColors1.length; ++j) {
    //   var c;
    //   if (flagColor == 0) {
    //     if (bla == 0) {
    //       c = faceColors1[j];
    //     }
    //     else {
    //       c = faceColors2[j];
    //     }
    //   }
    //   else if (flagColor == 1) {
    //     c = [Math.floor(Math.random() * 256)/255.0,Math.floor(Math.random() * 256)/255.0,Math.floor(Math.random() * 256)/255.0,1.0];
    //   }
    //
    // // Repeat each color four times for the four vertices of the face
    //   colors = colors.concat(c, c, c, c);
    // }
  }

  // const colorBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [
    [5.65, 2.34, 0,
     5.65, 2.34, 0,
     5.65, 2.34, 0,
     5.65, 2.34, 0],

    [2.34, 5.65, 0,
      2.34, 5.65, 0,
      2.34, 5.65, 0,
      2.34, 5.65, 0],

     [-2.34, 5.65, 0,
      -2.34, 5.65, 0,
      -2.34, 5.65, 0,
      -2.34, 5.65, 0],

     [-5.65, 2.34, 0,
      -5.65, 2.34, 0,
      -5.65, 2.34, 0,
      -5.65, 2.34, 0],

     [-5.65, -2.34, 0,
      -5.65, -2.34, 0,
      -5.65, -2.34, 0,
      -5.65, -2.34, 0],

     [-2.34, -5.65, 0,
      -2.34, -5.65, 0,
      -2.34, -5.65, 0,
      -2.34, -5.65, 0],

     [2.34, -5.65, 0,
      2.34, -5.65, 0,
      2.34, -5.65, 0,
      2.34, -5.65, 0],

     [5.65, -2.34, 0,
      5.65, -2.34, 0,
      5.65, -2.34, 0,
      5.65, -2.34, 0],
  ];

  var normals = [];

  for (var i=0; i<1000; i++) {
    c = vertexNormals[i%8],
    normals = normals.concat(c, c, c, c);
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var indices = [
    0,  1,  2,      1,  2,  3,    // front
    4,  5,  6,      5,  6,  7,    // back
    8,  9,  10,     9,  10, 11,   // top
    12, 13, 14,     13, 14, 15,   // bottom
    16, 17, 18,     17, 18, 19,   // right
    20, 21, 22,     21, 22, 23,   // left
    24, 25, 26,     25, 26, 27,
    28, 29, 30,     29, 30, 31,
  ];

  for(var i=0;i<999;i++)
  {
    var lenIn = indices.length;
    for(var j = 0;j<48;j++)
    {
      indices[lenIn+j] = indices[j]+32*(i+1);
    }
  }

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

function initBuffersObsCube(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  const positions = [
    // Front face
    -0.25, -4.0,  0.125,
     0.25, -4.0,  0.125,
     0.25,  4.0,  0.125,
    -0.25,  4.0,  0.125,

    // Back face
    -0.25, -4.0, -0.125,
    -0.25,  4.0, -0.125,
     0.25,  4.0, -0.125,
     0.25, -4.0, -0.125,

    // Top face
    -0.25,  4.0, -0.125,
    -0.25,  4.0,  0.125,
     0.25,  4.0,  0.125,
     0.25,  4.0, -0.125,

    // Bottom face
    -0.25, -4.0, -0.125,
     0.25, -4.0, -0.125,
     0.25, -4.0,  0.125,
    -0.25, -4.0,  0.125,

    // Right face
     0.25, -4.0, -0.125,
     0.25,  4.0, -0.125,
     0.25,  4.0,  0.125,
     0.25, -4.0,  0.125,

    // Left face
    -0.25, -4.0, -0.125,
    -0.25, -4.0,  0.125,
    -0.25,  4.0,  0.125,
    -0.25,  4.0, -0.125,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  // const faceColors = [
  //   [1.0,  0.0,  0.0,  1.0],    // Front face: white
  //   [1.0,  0.0,  0.0,  1.0],    // Back face: red
  //   [1.0,  0.0,  0.0,  1.0],    // Top face: green
  //   [1.0,  0.0,  0.0,  1.0],    // Bottom face: blue
  //   [1.0,  0.0,  0.0,  1.0],    // Right face: yellow
  //   [1.0,  0.0,  0.0,  1.0],    // Left face: purple
  // ];

  // Convert the array of colors into a table for all the vertices.

  // var colors = [];
  //
  // for (var j = 0; j < faceColors.length; ++j) {
  //   // const c = faceColors[j];
  //   const c = [Math.floor(Math.random() * 256)/255.0,Math.floor(Math.random() * 256)/255.0,Math.floor(Math.random() * 256)/255.0,1.0];
  //
  //   // Repeat each color four times for the four vertices of the face
  //   colors = colors.concat(c, c, c, c);
  // }

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // const colorBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function drawSceneObsCube(gl, programInfo, buffersCube, texture, deltaTime) {
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  if(x - x1 >= 0) {
    if (Math.floor((obsRotate*(180.0/Math.PI))%180)<=20.0 || Math.floor((obsRotate*(180.0/Math.PI))%180)>=160.0) {
      // alert(' Game Over! \n Score ' + score);
      life -= 1;
    }
    if (life == 0) {
      alert(' Game Over! \n Score ' + score);
    }
  }
  if (x-x1 >= 0) {
    x1 += 50;
    rotatCoeff = Math.random() / 10.0;
    obsRotate = 0.0;
    // tunnelSpeed += 5 * deltaTime;

    // console.log('modulo', obsRotate%Math.PI);
  }

  console.log('obsRotate', (obsRotate*(180.0/Math.PI))%180);

  obsRotate += rotatCoeff;

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, iniY, x-x1]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              obsRotate,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  // mat4.rotate(modelViewMatrix,  // destination matrix
  //             modelViewMatrix,  // matrix to rotate
  //             cubeRotation * .7,// amount to rotate in radians
  //             [0, 1, 0]);       // axis to rotate around (X)

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersCube.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // tell webgl how to pull out the texture coordinates from buffer
  {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersCube.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffersCube.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  // cubeRotation += deltaTime;
}

//
// Draw the scene.
//

var jump = 0;

var x = 0.0;
var extraRotate = 0;

Mousetrap.bind('d', function () {
  cubeRotation -= 0.05;
  obsRotate -= 0.05;
})

Mousetrap.bind('a', function () {
  cubeRotation += 0.05;
  obsRotate += 0.05;
})

Mousetrap.bind('space', function() {
  if (jump == 0) {
    speedY = -0.5;
    acclr = 0.03;
    jump = 1;
    // console.log('jump');
  }
})

Mousetrap.bind('a+space', function() {
  if (jump == 0) {
    speedY = -0.5;
    acclr = 0.03;
    jump = 1;
    cubeRotation += 0.05;
    obsRotate += 0.05;
    // console.log('jump');
  }
})

Mousetrap.bind('d+space', function() {
  if (jump == 0) {
    speedY = -0.5;
    acclr = 0.03;
    jump = 1;
    cubeRotation -= 0.05;
    obsRotate -= 0.05;
    // console.log('jump');
  }
})

Mousetrap.bind('b', function () {
  grayScale = !grayScale;
})

function drawScene(gl, programInfo, buffers, texture, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  x += 10 * deltaTime + tunnelSpeed;

  score = x;
  document.getElementById("score").innerHTML = "SCORE: "+score;
  document.getElementById("life").innerHTML = "LIFE: "+life;

  // console.log('score', score);

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, iniY, x]);  // amount to translate

  iniY += speedY;
  speedY += acclr;

  if(iniY >= 2.5) {
    iniY = 2.5;
    // modelViewMatrix[1] = 0.0;
    jump = 0;
    acclr = 0.0;
  }

  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              cubeRotation,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  // mat4.rotate(modelViewMatrix,  // destination matrix
  //             modelViewMatrix,  // matrix to rotate
  //             cubeRotation * .7,// amount to rotate in radians
  //             [0, 1, 0]);       // axis to rotate around (X)

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix);

      // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 48000;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  // cubeRotation += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
