var canvas;
var gl;
var programId;

var numCurves = 2;
var stepsPerCurve = 4;
var numAngles = 8;

var normals=[];
var texs =[];
  var vertices=[];


   var lightPosition = vec4(1.0,0.5,1.50, 1.0 );
    var lightAmbient = vec4( 0.850, 0.850, 0.8500, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

    var materialAmbient = vec4( 1.0, 1.0, 0.0, 1.0 );
    var materialDiffuse = vec4( 1.0, 0.0, 0.0, 1.0 );
    var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
    var shininess = 64.0;
    
    

//var ambientProduct, diffuseProduct, specularProduct;

var normalMatrix, normalMatrixLoc;
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var triangleBufferId;
var nBuffer;

// Binds "on-change" events for the controls on the web page
function initControlEvents() {
    // Use one event handler for all of the shape controls
    document.getElementById("shape-select").onchange = 
    document.getElementById("numAngles").onchange =
    document.getElementById("stepsPerCurve").onchange =
        function(e) {
            var shape = document.getElementById("shape-select").value;
            numAngles = parseFloat(document.getElementById("numAngles").value);
            stepsPerCurve = parseFloat(document.getElementById("stepsPerCurve").value);
            
            // Regenerate the vertex data
            if (shape == "profile1") {init1(cntrlPnts)}
            else if (shape == "profile2") {init2(cntrlPnts)}
            else if (shape == "profile3") {init3(cntrlPnts)}
            else if (shape == "profile4") {init4(cntrlPnts)}
            else if (shape == "profile5") {init5(cntrlPnts)};
            buildSurfaceOfRevolution(cntrlPnts);
        };
        
    // Event handler for the foreground color control
    document.getElementById("foreground-color").onchange =       
      function(e) {
            //updateTriangleColor(getTriangleColor());
             materialDiffuse =vec4(getTriangleColor(),1.0);
            //console.log(materialDiffuse);
            updateTriangleColor(getTriangleColor());
        };
        
    // Event handler for the FOV control
    document.getElementById("fov").onchange =
        function(e) {
            updateProjection(perspective(getFOV(), 1, 0.01, 100));
        };
    }

// Function for querying the current triangle color
function getTriangleColor() {
    var hex = document.getElementById("foreground-color").value;
    var red = parseInt(hex.substring(1, 3), 16);
    var green = parseInt(hex.substring(3, 5), 16);
    var blue = parseInt(hex.substring(5, 7), 16);
    return vec3(red / 255.0, green / 255.0, blue / 255.0);
}

// Function for querying the current field of view
function getFOV() {
    return parseFloat(document.getElementById("fov").value);
}
var texture1;

function configureTexture() {
	var image1;
	image1 = document.getElementById("wood-img");
    texture1 = gl.createTexture();       
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,  image1);
    //gl.generateMipmap( gl.TEXTURE_2D );
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.activeTexture( gl.TEXTURE0 );
	    gl.bindTexture( gl.TEXTURE_2D, texture1 );
	    gl.uniform1i(gl.getUniformLocation(programId, "s_texture"), 0);	   
}
window.onload = function() {
    // Find the canvas on the page
    canvas = document.getElementById("gl-canvas");
    
    // Initialize a WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); 
    }
      gl.enable(gl.DEPTH_TEST);
    // Load shaders
    programId = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(programId);
    //materialDiffuse=vec4(getTriangleColor(),0.1);
    
    // Set up events for the HTML controls
    //materialDiffuse =vec4(getTriangleColor(),1.0);
    initControlEvents();

    // Setup mouse and keyboard input
    initWindowEvents();
    
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    //materialDiffuse = vec4(getTriangleColor(),1.0);
    
    // Load the initial data into the GPU
    
    //nBuffer = gl.createBuffer();
    init1(cntrlPnts);
   configureTexture(); 
        	 buildSurfaceOfRevolution(cntrlPnts);
         
    
    
    
    // Initialize the view and rotation matrices
    findShaderVariables();
    viewMatrix = lookAt(vec3(0,0,5), vec3(0,0,0), vec3(0,1,0));
    normalMatrix = [
                    vec3(viewMatrix[0][0], viewMatrix[0][1], viewMatrix[0][2]),
                    vec3(viewMatrix[1][0], viewMatrix[1][1], viewMatrix[1][2]),
                    vec3(viewMatrix[2][0], viewMatrix[2][1], viewMatrix[2][2])
                    ];

    rotationMatrix = mat4(1);
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    //console.log(ambientProduct);
  //  console.log(diffuseProduct);
    
    updateModelView(viewMatrix);
    
    // Initialize the projection matrix
    updateProjection(perspective(getFOV(), 1, 0.01, 100));
    updateNormalMatrix(normalMatrix);
    
    // Initialize the triangle color
    
    updateLightPosition(lightPosition)
    //updateTriangleColor(getTriangleColor());
    updateAmbient(ambientProduct);
    updateDiffuse(diffuseProduct);
    updateSpecular(specularProduct);
    updateShiness(shininess);
    updateTriangleColor(getTriangleColor());
    // Start continuous rendering
    window.setInterval(render, 33);
};

// The current view matrix
var viewMatrix;

// The current rotation matrix produced as the result of cumulative mouse drags.
// I chose to implement the effect of mouse dragging as "rotating the object."
// It would also be acceptable to implement it as "moving the camera."
var rotationMatrix;

// The OpenGL ID of the vertex buffer containing the current shape


// The number of vertices in the current vertex buffer
var trianglePointCount;
var shiftdown = false;
// Sets up keyboard and mouse events
function initWindowEvents() {
    var shift=0;
    // Affects how much the camera moves when the mouse is dragged.
    var sensitivity = 1;

    // Additional rotation caused by an active drag.
    var newRotationMatrix;
    
    // Whether or not the mouse button is currently being held down for a drag.
    var mousePressed = false;
    
    // The place where a mouse drag was started.
    var startX, startY;

    canvas.onmousedown = function(e) {
        // A mouse drag started.
        mousePressed = true;
        
        // Remember where the mouse drag started.
        startX = e.clientX;
        startY = e.clientY;
    }

    canvas.onmousemove = function(e) {
        if (mousePressed) {
            // Handle a mouse drag by constructing an axis-angle rotation matrix
          if (shift == 1)
          {
              var rect = canvas.getBoundingClientRect();
              var newX = Math.round(e.clientX-rect.left);
              var newY = Math.round(e.clientY-rect.top);
              var x=((newX*2)/canvas.width)-1;
              var y=1-((newY*2)/canvas.height);
              lightPosition[0]=x;
              lightPosition[1]=y;
              updateLightPosition(lightPosition);

          }
          else
          	{
          	var axis = vec3(e.clientY - startY, e.clientX - startX, 0.0);
            var angle = length(axis) * sensitivity;
            if (angle > 0.0) {
                // Update the temporary rotation matrix
                newRotationMatrix = mult(rotate(angle, axis), rotationMatrix);
                
                // Update the model-view matrix.
                updateModelView(mult(viewMatrix, newRotationMatrix));
            }
             
             
              
            }
        }
    }

    window.onmouseup = function(e) {
        // A mouse drag ended.
        mousePressed = false;
          shiftdown = false;
        if (newRotationMatrix) {
            // "Lock" the temporary rotation as the current rotation matrix.
            rotationMatrix = newRotationMatrix;
        }
      
        newRotationMatrix = null;
    }
    
    var speed = 0.1; // Affects how fast the camera pans and "zooms"
    window.onkeyup=function(e){
        shift=0;
    }
    window.onkeydown = function(e) {
        if (e.keyCode === 190) { // '>' key
            // "Zoom" in
            viewMatrix = mult(translate(0,0,speed), viewMatrix);
        }
        else if (e.shiftKey)
        {
            shift=1;
        }
        else if (e.keyCode === 188) { // '<' key
            // "Zoom" out
            viewMatrix = mult(translate(0,0,-speed), viewMatrix);
        }
        else if (e.keyCode === 37) { // Left key
            // Pan left
            viewMatrix = mult(translate(speed,0,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault(); 
        }
        else if (e.keyCode === 38) { // Up key
            // Pan up
            viewMatrix = mult(translate(0,-speed,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault();
        }
        else if (e.keyCode === 39) { // Right key
            // Pan right
            viewMatrix = mult(translate(-speed,0,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault();
        }
        else if (e.keyCode === 40) { // Down key
            // Pan down 
            viewMatrix = mult(translate(0,speed,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault();
        }
        
        // Update the model-view matrix and render.
        updateModelView(mult(viewMatrix, rotationMatrix));
        render();
    }
}

//
// Create data for a surface of revolution
//

var cntrlPnts = [];

function init1(theCntrlPnts) {
    
    var numControlPoints = numCurves * 3 + 1;
    
    // Initialize control point data
    for (var i = 0; i < numControlPoints; i++)
    {
        theCntrlPnts[i] = vec4(0.5, i / (numControlPoints - 1.0) * 1.6 - 0.8, 0, 1);
    }
}

function init2(theCntrlPnts) {

    theCntrlPnts[0] = vec4(0.1, -1.0, 0.0, 1);
    theCntrlPnts[1] = vec4(0.3, -0.8, 0.0, 1);
    theCntrlPnts[2] = vec4(0.4, -0.4, 0.0, 1);
    theCntrlPnts[3] = vec4(0.45,  0.0, 0.0, 1);
    theCntrlPnts[4] = vec4(0.5,  0.4, 0.0, 1);
    theCntrlPnts[5] = vec4(0.7,  0.8, 0.0, 1);
    theCntrlPnts[6] = vec4(0.9,  1.0, 0.0, 1);
}

function init3(theCntrlPnts) {
    
    theCntrlPnts[0] = vec4(0.9, -1.0, 0.0, 1);
    theCntrlPnts[1] = vec4(0.7, -0.8, 0.0, 1);
    theCntrlPnts[2] = vec4(0.5, -0.4, 0.0, 1);
    theCntrlPnts[3] = vec4(0.5,  0.0, 0.0, 1);
    theCntrlPnts[4] = vec4(0.5,  0.4, 0.0, 1);
    theCntrlPnts[5] = vec4(0.7,  0.8, 0.0, 1);
    theCntrlPnts[6] = vec4(0.9,  1.0, 0.0, 1);
}

function init4(theCntrlPnts) {
    
    theCntrlPnts[0] = vec4(0.1, -1.0, 0.0, 1);
    theCntrlPnts[1] = vec4(0.5, -0.8, 0.0, 1);
    theCntrlPnts[2] = vec4(0.7, -0.4, 0.0, 1);
    theCntrlPnts[3] = vec4(0.7,  0.0, 0.0, 1);
    theCntrlPnts[4] = vec4(0.7,  0.4, 0.0, 1);
    theCntrlPnts[5] = vec4(0.5,  0.8, 0.0, 1);
    theCntrlPnts[6] = vec4(0.1,  1.0, 0.0, 1);
}

function init5(theCntrlPnts) {
    
    theCntrlPnts[0] = vec4(0.1, -1.0, 0.0, 1);
    theCntrlPnts[1] = vec4(0.5, -0.8, 0.0, 1);
    theCntrlPnts[2] = vec4(0.3, -0.4, 0.0, 1);
    theCntrlPnts[3] = vec4(0.2,  0.0, 0.0, 1);
    theCntrlPnts[4] = vec4(0.1,  0.4, 0.0, 1);
    theCntrlPnts[5] = vec4(0.1,  0.8, 0.0, 1);
    theCntrlPnts[6] = vec4(0.1,  1.0, 0.0, 1);
}

function getTVector(vt)
{
    // Compute value of each basis function
    var mt = 1.0 - vt;
    return vec4(mt * mt * mt, 3 * vt * mt * mt, 3 * vt * vt * mt, vt * vt * vt);
}

function dotProduct(pnt1, pnt2, pnt3, pnt4, tVal)
{
    // Take dot product between each basis function value and the x, y, and z values
    // of the control points
    return vec3(pnt1[0]*tVal[0] + pnt2[0]*tVal[1] + pnt3[0]*tVal[2] + pnt4[0]*tVal[3],
                pnt1[1]*tVal[0] + pnt2[1]*tVal[1] + pnt3[1]*tVal[2] + pnt4[1]*tVal[3],
                pnt1[2]*tVal[0] + pnt2[2]*tVal[1] + pnt3[2]*tVal[2] + pnt4[2]*tVal[3]);
}


// You will want to edit this function to compute the additional attribute data
// for texturing and lighting
var index=0;

function buildSurfaceOfRevolution(controlPoints)
{
    var dt = 1.0 / stepsPerCurve;
    var da = 360.0 / (numAngles);
    
    //var vertices = [];
    var p = 0, t1=0,t2=0;
      vertices=[];
     normals=[];
     texs =[];
    for (var i = 0; i < numCurves; i++)
    {
        var bp1 = controlPoints[i * 3 + 0];
        var bp2 = controlPoints[i * 3 + 1];
        var bp3 = controlPoints[i * 3 + 2];
        var bp4 = controlPoints[i * 3 + 3];
        
        for (var t = 0; t < stepsPerCurve; t++) {
            var p1 = dotProduct(bp1, bp2, bp3, bp4, getTVector(t * dt));
            var p2 = dotProduct(bp1, bp2, bp3, bp4, getTVector((t + 1) * dt));
            
            var savedP = p;
            
            for (var a = 0; a < numAngles; a++) {
              //  texs[p] =  vec2((i)*(1.0/numCurves) +a*da*0.5/360.0 ,((i)*(1.0/numCurves) +t*dt*0.5 ));
                vertices[p++] = vec4(Math.cos(a * da * Math.PI / 180.0) * p1[0], p1[1],
                                     Math.sin(a * da * Math.PI / 180.0) * p1[0],1.0);
                //    texs[p]=vec2((i)*(1.0/numCurves) +a*da*0.5/360.0 ,((i)*(1.0/numCurves) +(t+1)*dt*0.5 )	);
                                   //   console.log(vertices[p-1]);
                 // texs[p] =  vec2(Math.cos((a * da * Math.PI / 180.0) * (t+1)*dt),1-Math.sin((a * da * Math.PI / 180.0)*(t+1)*dt));
                vertices[p++] = vec4(Math.cos(a * da * Math.PI / 180.0) * p2[0], p2[1],
                                     Math.sin(a * da * Math.PI / 180.0) * p2[0],1.0);
            }
          //   texs[p]= texs[savedP];
            vertices[p++] = vertices[savedP];
          //  texs[p] =  texs[savedP+1];
            vertices[p++] = vertices[savedP + 1];
           
        }
    }
    
    	
    console.log(texs.length);
    
    for(var i =0;i<texs.length;i++)
    {
    		console.log(texs[i]);
    }
   // console.log(vertices.length);
    var v1, v2,v3,v4,v5,v6, norm1,k1,k2,k3,k4,k5;
         normals=[];
         
      
   
    
       k1 = vertices[0];
    	 k2  = vertices[1];
    	 k3 = vertices[2];
    	 
      v1 = subtract(k2,k1);
      
    	 v2 = subtract(k3,k1);
    	 n1 = normalize(cross(v1,v2));
    normals.push(normalize(vec4(n1,0)));
 
     k1 = vertices[0];
    	 k2  = vertices[1];
    	 k3 = vertices[2];   
    	  k4 = vertices[3];
       v1 = subtract(k2,k1);
    	 v2 = subtract(k3,k1);
    	 n1 = normalize(cross(v1,v2));
    	         
    	 v3 = subtract(k3,k2);
    	 v4 = subtract(k4,k2);
    	 n2 = normalize(cross(v4,v3));
    	  
    	
    	
    	   n =vec4(n1[0]+n2[0],n1[1]+n2[1],n1[2]+n2[2],0);
    	//     console.log(n);
     normals.push(normalize(n));
    for(var k=2; k<vertices.length-2; k++)
    {
    	 k1 = vertices[k-2];
    	 k2  = vertices[k-1];
    	 k3 = vertices[k];    	 
   	   k4 = vertices[k+1];
       k5 = vertices[k+2];
    	 
    	 v1 = subtract(k1,k3);
    	 v2 = subtract(k2,k3);
    	 n1 =  (cross(v1,v2));
    	         
    	 v3 = subtract(k2,k3);
    	 v4 = subtract(k4,k3);
    	 n2 =  (cross(v3,v4));
    	 
    	 v5 = subtract(k4,k3);
    	 v6= subtract(k5,k3);
    	 n3 =  (cross(v5,v6));
    	 
    	 
      n =vec4(n1[0]+n2[0]+n3[0],n1[1]+n2[1]+n3[1],n1[2]+n2[2]+n3[2],0);
  
       normals.push(normalize(vec4(n,0)));
    } 
    
  
     k=vertices.length-3;
     k1 = vertices[k-1];
    	 k2  = vertices[k];
    	 k3 = vertices[k+1];   
    	  k4 = vertices[k+2];
     v1 = subtract(k2,k1);
    	 v2 = subtract(k3,k1);
    	 n1 = cross(v1,v2);
    	         
    	 v3 = subtract(k2,k3);
    	 v4 = subtract(k4,k3	);
    	 n2 = cross(v3,v4);
    	     n =vec4(n1[0]+n2[0],n1[1]+n2[1],n1[2]+n2[2],0);
    	     
     normals.push(normalize(n));
    //  console.log(n);
    k=vertices.length; 
        k1 = vertices[k-1];
    	 k2  = vertices[k-2];
    	 k3 =  vertices[k-3];
      v1 = subtract(k1,k2);
    	 v2 = subtract(k1,k3);
    	 n1 = cross(v1,v2);
    normals.push(normalize(vec4(n1,0)));
// 
  for(i=0;i<normals.length;i++)
 {
 	console.log(normals[i]);
 }
// console.log(normals.length);
// 
//  for(i=0;i<vertices.length;i++)
//{
//	console.log(vertices[i]);
//}
//     console.log(vertices.length);
    //console.log(normals);
    //console.log(vertices);
    index=normals.length;
    // Pass the new set of vertices to the graphics card
    trianglePointCount = p;

 triangleBufferId = gl.createBuffer();
    
     
     gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferId );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    // Associate the shader variable for position with our data buffer
    var vPosition = gl.getAttribLocation(programId, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false,0, 0);
    gl.enableVertexAttribArray(vPosition);
  
    nBuffer = gl.createBuffer();
 
    var vNormal = gl.getAttribLocation( programId, "vNormal" );
    gl.enableVertexAttribArray(vNormal);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0 , 0 );
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
    
 
   
  
//  nBuffer = gl.createBuffer();
//    
//    var vTex = gl.getAttribLocation( programId, "texs" );
//    gl.enableVertexAttribArray(vTex);
//    gl.vertexAttribPointer(vTex, 2, gl.FLOAT, false, 0 , 0 );
//    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
//    gl.bufferData( gl.ARRAY_BUFFER, flatten(texs), gl.STATIC_DRAW );
    
  

   
    
    
    
}


// The locations of the required GLSL uniform variables.
var locations = {};

// Looks up the locations of uniform variables once.
function findShaderVariables() {
    locations.modelView = gl.getUniformLocation(programId, "modelView");
    locations.projection = gl.getUniformLocation(programId, "projection");
    locations.normalMatrix = gl.getUniformLocation(programId, "normalMatrix");
    locations.triangleColor = gl.getUniformLocation(programId, "triangleColor");
    locations.ambientProduct = gl.getUniformLocation(programId,"ambiantProduct");
    locations.diffuseProduct=gl.getUniformLocation(programId,"diffuseProduct");
    locations.specularProduct=gl.getUniformLocation(programId,"specularProduct");
    locations.lightPosition=gl.getUniformLocation(programId,"lightPosition");
    locations.shininess=gl.getUniformLocation(programId,"shininess");
    //normalMatrixLoc = gl.getUniformLocation( programId, "normalMatrix" );
}

// Pass an updated model-view matrix to the graphics card.
function updateModelView(modelView) {
    gl.uniformMatrix4fv(locations.modelView, false, flatten(modelView));
}

// Pass an updated projection matrix to the graphics card.
function updateProjection(projection) {
    gl.uniformMatrix4fv(locations.projection, false, flatten(projection));
}
function updateNormalMatrix(normalMatrix) {
    gl.uniformMatrix3fv(locations.normalMatrix, false, flatten(normalMatrix));
        
}
function updateLightPosition(lightPosition) {
    gl.uniform4fv(locations.lightPosition, flatten(lightPosition));
}
function updateAmbient(ambientProduct) {
    gl.uniform4fv(locations.ambientProduct, flatten(ambientProduct));
}
function updateDiffuse(diffuseProduct) {
    gl.uniform4fv(locations.diffuseProduct, flatten(diffuseProduct));
}
function updateSpecular(specularProduct) {
    gl.uniform4fv(locations.specularProduct, flatten(specularProduct));
}
function updateShiness(materialShininess) {
    gl.uniform1f(locations.shininess, shininess);
}


function YellowPlastics()
{  gl.uniform1f(gl.getUniformLocation(programId,"usetexture"), false);
    document.getElementById("foreground-color").value= "#ffff00";
    materialAmbient = vec4( 0.0,0.0,0.0,1.0 );
    materialDiffuse =vec4(0.5,0.5,0.0,1.0);
    materialSpecular = vec4( 0.6,0.6,0.5, 1.0 );
    shininess = 32.0;
          ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
        updateAmbient(ambientProduct);
    updateDiffuse(diffuseProduct);
    updateSpecular(specularProduct);
    updateShiness(shininess);
  
}
function BRASSMETAL()
{
	document.getElementById("foreground-color").value= "#ffff11";

	      materialAmbient = vec4( 0.329412, 0.223529, 0.027451, 1.000000);
      materialDiffuse = vec4(0.780392, 0.568627, 0.113725, 1.000000 );
      materialSpecular = vec4( 0.992157, 0.941176, 0.807843, 1.000000);
      shininess =  27.897400;
gl.uniform1f(gl.getUniformLocation(programId,"usetexture"), false);
	      ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
       updateAmbient(ambientProduct);
    updateDiffuse(diffuseProduct);
    updateSpecular(specularProduct);
    updateShiness(shininess);
}

function Texturemap()
{
gl.uniform1f(gl.getUniformLocation(programId,"usetexture"), true);
    materialAmbient = vec4( 0.0,0.0,0.0,1.0 );
    materialDiffuse =vec4(1.0,1.0,1.0,1.0);
    materialSpecular = vec4( 0.6,0.6,0.5, 1.0 );
    shininess = 32.0;
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    updateAmbient(ambientProduct);
    updateDiffuse(diffuseProduct);
    updateSpecular(specularProduct);
    updateShiness(shininess);
    updateTriangleColor(getTriangleColor());
    
}

// Pass an updated projection matrix to the graphics card.
function updateTriangleColor(triangleColor) {
    gl.uniform3fv(locations.triangleColor, triangleColor);
}

// Render the scene
function render() {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    
        // Draw the triangle strips
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, trianglePointCount);

    //gl.drawArrays(gl.POINT, 0, trianglePointCount);
}
