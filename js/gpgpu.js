﻿// JavaScript source code

function Assert(b, msg) {
    if (!b) {
        console.log(msg);
    }
};

function MakeFloat32Index(n) {
    var v = new Float32Array(n);
    for (var i = 0; i < n; i++) {
        v[i] = i;
    }

    return v;
}

function make2DArray(nrow, ncol, init) {
    var v;
    
    if(init){
        if (init instanceof Float32Array) {

            v = init;
        }
        else {

            v = new Float32Array(init);
        }

        Assert(v.length == nrow * ncol);
    }
    else{

        v = new Float32Array(nrow * ncol);
    }

    v.nrow  = nrow;
    v.ncol  = ncol;

    v.shape = [nrow, ncol];

    return v;
}

class TextureInfo {
    constructor(texel_type, value) {
        this.texelType = texel_type;
        this.value     = value;
    }
}

class ArrayView {
    constructor() {
        var args;

        if(arguments.length == 1 && Array.isArray(arguments[0])) {

            args = arguments[0];
        }
        else {

            // 引数のリストをArrayに変換します。
            args = Array.prototype.slice.call(arguments);
        }

        // 引数の最後
        var last_arg = args[args.length -1];
        if (typeof last_arg != 'number') {
            // 引数の最後が数値でない場合

            if (typeof last_arg == 'ArrayView') {

                this.dt = new Float32Array(last_arg.dt);
            }
            else {

                Assert(last_arg instanceof Float32Array, "is Float32Array");
                this.dt = last_arg;
            }

            args.pop();
        }

        this.shape = args;

        this.ncol = this.shape[this.shape.length -1];
        if (this.shape.length == 1) {

            this.nrow = 1;
        }
        else {

            this.nrow = this.shape[this.shape.length -2];
        }

        if (!this.dt) {
            this.dt = new Float32Array(this.shape.reduce((x, y) => x * y));
        }
    }

    Map(f) {
        return new ArrayView(this.nrow, this.ncol, this.dt.map(f));
    }

    T() {
        var m = new ArrayView(this.ncol, this.nrow);
        for (var r = 0; r < this.ncol; r++) {
            for (var c = 0; c < this.nrow; c++) {
                m.dt[r * this.nrow +c]= this.dt[c * this.ncol + r];
            }
        }

        return m;
    }

    At(r, c) {
        Assert(r < this.nrow && c < this.ncol, "ArrayView-at");
        return this.dt[r * this.ncol +c];
    }

    Set(r, c, val) {
        Assert(r < this.nrow && c < this.ncol, "ArrayView-set");

        this.dt[r * this.ncol +c]= val;
    }

    Set3(d, r, c, val) {
        Assert(d < this.shape[this.shape.length -3]&& r < this.nrow && c < this.ncol, "ArrayView-set3");

        this.dt[(d * this.nrow +r) * this.ncol +c]= val;
    }

    At3(d, r, c) {
        Assert(d < this.shape[this.shape.length -3]&& r < this.nrow && c < this.ncol, "ArrayView-at3");

        return this.dt[(d * this.nrow +r) * this.ncol +c];
    }

    Col(c) {
        var v = new Float32Array(this.nrow);
        for (var r = 0; r < this.nrow; r++) {
            v[r]= this.dt[r * this.ncol +c];
        }

        return new ArrayView(this.nrow, 1, v);
    }

    Add(m) {
        Assert(m instanceof ArrayView && m.nrow == this.nrow && m.ncol == this.ncol, "ArrayView-add");
        var v = new Float32Array(this.nrow * this.ncol);
        for (var r = 0; r < this.nrow; r++) {
            for (var c = 0; c < this.ncol; c++) {
                var k = r * this.ncol +c;
                v[k] = this.dt[k]+m.dt[k];
            }
        }

        return new ArrayView(this.nrow, this.ncol, v);
    }

    AddVec(vec) {
        Assert(vec instanceof ArrayView && vec.nrow == this.nrow && vec.ncol == 1, "ArrayView-add-V");
        var v = new Float32Array(this.nrow * this.ncol);
        for (var r = 0; r < this.nrow; r++) {
            for (var c = 0; c < this.ncol; c++) {
                var k = r * this.ncol + c;
                v[k] = this.dt[k] + vec.dt[r];
            }
        }

        return new ArrayView(this.nrow, this.ncol, v);
    }

    Reduce(f) {
        var v = new Float32Array(this.nrow);
        for (var r = 0; r < this.nrow; r++) {
            var x;
            for (var c = 0; c < this.ncol; c++) {
                var k = r * this.ncol +c;
                if (c == 0) {

                    x = this.dt[k];
                }
                else {

                    x = f(x, this.dt[k]);
                }
            }
            v[r]= x;
        }

        return new ArrayView(this.nrow, 1, v);
    }

    Sub(m) {
        Assert(m instanceof ArrayView && m.nrow == this.nrow && m.ncol == this.ncol, "ArrayView-Sub");
        var v = new Float32Array(this.nrow * this.ncol);
        for (var r = 0; r < this.nrow; r++) {
            for (var c = 0; c < this.ncol; c++) {
                var k = r * this.ncol + c;
                v[k]= this.dt[k]-m.dt[k];
            }
        }

        return new ArrayView(this.nrow, this.ncol, v);
    }

    Mul(m) {
        if (m instanceof Number) {

            return new ArrayView(this.nrow, this.ncol, this.dt.map(x => x * m));
            }
        Assert(m instanceof ArrayView && m.nrow == this.nrow && m.ncol == this.ncol && m.columnMajor == this.columnMajor, "Array-View-mul");
        var v = new Float32Array(this.nrow * this.ncol);
        for (var r = 0; r < this.nrow; r++) {
            for(var c = 0; c < this.ncol; c++) {
                var k = r * this.ncol +c;
                v[k]= this.dt[k]* m.dt[k];
                }
        }

        return new ArrayView(this.nrow, this.ncol, v);
    }

    Dot(m) {
        Assert(m instanceof ArrayView && m.nrow == this.ncol, "ArrayView-Dot");

        var v = new Float32Array(this.nrow * m.ncol);
        for (var r = 0; r < this.nrow; r++) {
            for(var c = 0; c < m.ncol; c++) {
                var sum = 0;
                for (var k = 0; k < this.ncol; k++) {
                    sum += this.dt[r * this.ncol +k]* m.dt[k * m.ncol +c];
                }
                v[r * m.ncol +c]= sum;
                }
                }
        return new ArrayView(this.nrow, m.ncol, v);
    }
}

function CreateGPGPU(canvas) {
    let gl;

    function chk() {
        Assert(gl.getError() == gl.NO_ERROR);
    }

    class GPGPU {
        constructor(canvas) {
            console.log("init WebGL");
            this.setStandardShader();

            this.packages = {};

            if (!canvas) {

                // -- Init Canvas
                canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                document.body.appendChild(canvas);
            }
            this.canvas = canvas;

            // -- Init WebGL Context
            gl = canvas.getContext('webgl2', { antialias: false });
            var isWebGL2 = !!gl;
            if (!isWebGL2) {
                console.log("WebGL 2 is not available. See How to get a WebGL 2 implementation");
                console.log("https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation");

                throw "WebGL 2 is not available.";
            }

            this.TEXTUREs = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3];
        }

        getGL() {
            return gl;
        }

        WebGLClear() {
            for (var id in this.packages) {
                var pkg = this.packages[id];

                gl.bindBuffer(gl.ARRAY_BUFFER, null); chk();
                gl.deleteBuffer(pkg.idxBuffer); chk();

                for (let varying of pkg.varyings) {
                    if (varying.feedbackBuffer) {
                        gl.deleteBuffer(varying.feedbackBuffer); chk();
                    }
                }

                gl.deleteTransformFeedback(pkg.transformFeedback); chk();

                gl.bindTexture(gl.TEXTURE_2D, null); chk();
                gl.bindTexture(gl.TEXTURE_3D, null); chk();

                pkg.textures.forEach(x => gl.deleteTexture(x.Texture), chk())

                gl.deleteProgram(pkg.program); chk();
                console.log("clear pkg:" + pkg.id);
            }
        }

        parseShader(pkg, param) {
            pkg.attributes = [];
            pkg.uniforms = [];
            pkg.textures = [];
            pkg.varyings = [];
            for(let shader_text of[ param.vertexShader,  param.fragmentShader ]) {

                var lines = shader_text.split(/(\r\n|\r|\n)+/);
                for(let line of lines) {

                    var tokens = line.trim().split(/[\s\t]+/);
                    if (tokens.length < 3) {
                        continue;
                    }

                    var tkn0 = tokens[0];
                    var tkn1 = tokens[1];
                    var tkn2 = tokens[2];

                    if (tkn0 != "in" && tkn0 != "uniform" && tkn0 != "out") {
                        continue;
                    }
                    if (tkn0 != "uniform" && shader_text == param.fragmentShader) {

                        continue;
                    }
                    Assert(tkn1 == "int" || tkn1 == "float" || tkn1 == "vec2" || tkn1 == "vec3" || tkn1 == "vec4" ||
                        tkn1 == "sampler2D" || tkn1 == "sampler3D" ||
                        tkn1 == "mat4" || tkn1 == "mat3" || tkn1 == "bool");


                    var arg_name;
                    var is_array = false;
                    var k1 = tkn2.indexOf("[");
                    if (k1 != -1) {
                        arg_name = tkn2.substring(0, k1);
                        is_array = true;
                    }
                    else{
                        var k2 = tkn2.indexOf(";");
                        if (k2 != -1) {
                            arg_name = tkn2.substring(0, k2);
                        }
                        else{
                            arg_name = tkn2;
                        }
                    }

                    var arg_val = param.args[arg_name];
                    if(arg_val == undefined){
                        if(tokens[0] == "out"){
                            continue;
                        }
                    }

                    if (tkn1 == "sampler2D" || tkn1 == "sampler3D") {

                        Assert(tokens[0] == "uniform" && arg_val instanceof TextureInfo);

                        arg_val.name = arg_name;
                        arg_val.samplerType = tkn1;
                        arg_val.isArray = is_array;

                        pkg.textures.push(arg_val);
                    }
                    else {
                    
                        var arg_inf = { name: arg_name, value: arg_val, type: tkn1, isArray: is_array };

                        switch (tokens[0]) {
                            case "in":
                                pkg.attributes.push(arg_inf);
                                break;

                            case "uniform":
                                pkg.uniforms.push(arg_inf);
                                break;

                            case "out":
                                pkg.varyings.push(arg_inf);
                                break;
                        }
                    }
                }
            }
        }

        makeProgram(vshaderTransform, fshaderTransform, varyings) {
            var prg = gl.createProgram(); chk();
            gl.attachShader(prg, vshaderTransform); chk();
            gl.attachShader(prg, fshaderTransform); chk();

            if (varyings) {

                var varying_names = varyings.map(x => x.name);
                gl.transformFeedbackVaryings(prg, varying_names, gl.SEPARATE_ATTRIBS); chk();   // gl.INTERLEAVED_ATTRIBS 
            }

            gl.linkProgram(prg); chk();


            if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
                console.log("Link Error:" + gl.getProgramInfoLog(prg));
            }


            gl.deleteShader(vshaderTransform); chk();
            gl.deleteShader(fshaderTransform); chk();

            return prg;
        }

        makeShader(type, source) {
            var shader = gl.createShader(type); chk();
            gl.shaderSource(shader, source); chk();
            gl.compileShader(shader); chk();

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }

        makeAttrib(pkg) {
            for (let attrib of pkg.attributes) {
                var attrib_dim = this.vecDim(attrib.type);
                var attrib_len = attrib.value instanceof ArrayView ? attrib.value.dt.length : attrib.value.length;
                var elemen_count = attrib_len / attrib_dim;

                if (pkg.elementCount == undefined) {
                    pkg.attribElementCount = elemen_count;
                }
                else {

                    Assert(pkg.elementCount == elemen_count);
                }

                attrib.AttribBuffer = gl.createBuffer();
                attrib.AttribLoc = gl.getAttribLocation(pkg.program, attrib.name); chk();
                gl.enableVertexAttribArray(attrib.AttribLoc); chk();
                gl.bindAttribLocation(pkg.program, attrib.AttribLoc, attrib.name);
            }
        }

        makeTexture(pkg) {
            for (var i = 0; i < pkg.textures.length; i++) {
                var tex_inf = pkg.textures[i];

                tex_inf.locTexture = gl.getUniformLocation(pkg.program, tex_inf.name); chk();

                var dim = tex_inf.samplerType == "sampler3D" ? gl.TEXTURE_3D : gl.TEXTURE_2D;

                tex_inf.Texture = gl.createTexture(); chk();

                gl.activeTexture(this.TEXTUREs[i]); chk();
                gl.bindTexture(dim, tex_inf.Texture); chk();

                if (tex_inf.value instanceof Image) {
                    // テクスチャが画像の場合

                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); chk();
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); chk();

                    //        gl.texParameteri(gl.TEXTURE_2D, gl.GL_TEXTURE_WRAP_S, gl.GL_MIRRORED_REPEAT); //GL_REPEAT
                    //        gl.texParameteri(gl.TEXTURE_2D, gl.GL_TEXTURE_WRAP_T, gl.GL_MIRRORED_REPEAT); //GL_REPEAT

                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); chk();
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex_inf.value); chk();
                    gl.generateMipmap(gl.TEXTURE_2D); chk();
                }
                else {
                    // テクスチャが画像でない場合

                    gl.texParameteri(dim, gl.TEXTURE_MAG_FILTER, gl.NEAREST); chk();
                    gl.texParameteri(dim, gl.TEXTURE_MIN_FILTER, gl.NEAREST); chk();
                    gl.texParameteri(dim, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); chk();
                    gl.texParameteri(dim, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); chk();
                }
            }
        }

        setTextureData(pkg) {
            for (var i = 0; i < pkg.textures.length; i++) {
                var tex_inf = pkg.textures[i];

                gl.uniform1i(tex_inf.locTexture, i); chk();

                var dim = tex_inf.samplerType == "sampler3D" ? gl.TEXTURE_3D : gl.TEXTURE_2D;

                gl.activeTexture(this.TEXTUREs[i]); chk();
                gl.bindTexture(dim, tex_inf.Texture); chk();

                if (tex_inf.value instanceof Image) {
                    // テクスチャが画像の場合

                }
                else {
                    // テクスチャが画像でない場合

                    var data;
                    if (tex_inf.value instanceof ArrayView) {
                        data = tex_inf.value.dt;
                    }
                    else {
                        data = tex_inf.value;
                    }

                    var internal_format, format, col_size;
                    switch (tex_inf.texelType) {
                        case "float":
                            internal_format = gl.R32F;
                            format = gl.RED;
                            col_size = 1;
                            break;

                        case "vec2":
                            internal_format = gl.RG32F;
                            format = gl.RG;
                            col_size = 2;
                            break;

                        case "vec3":
                            internal_format = gl.RGB32F;
                            format = gl.RGB;
                            col_size = 3;
                            break;

                        case "vec4":
                            internal_format = gl.RGBA32F;
                            format = gl.RGBA;
                            col_size = 4;
                            break;

                        default:
                            Assert(false);
                            break;
                    }

                    if (dim == gl.TEXTURE_2D) {

//                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, tex_inf.value.ncol / 4, tex_inf.value.nrow, 0, gl.RGBA, gl.FLOAT, tex_inf.value.dt); chk();
//                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, tex_inf.value.ncol, tex_inf.value.nrow, 0, gl.RED, gl.FLOAT, data); chk();
                        gl.texImage2D(gl.TEXTURE_2D, 0, internal_format, tex_inf.value.ncol / col_size, tex_inf.value.nrow, 0, format, gl.FLOAT, data); chk();
                    }
                    else {
                        Assert(dim == gl.TEXTURE_3D, "Set-Tex");

//                        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA32F, tex_inf.value.ncol / 4, tex_inf.value.nrow, tex_inf.value.shape[tex_inf.value.shape.length - 3], 0, gl.RGBA, gl.FLOAT, data); chk();
                        gl.texImage3D(gl.TEXTURE_3D, 0, internal_format, tex_inf.value.ncol / col_size, tex_inf.value.nrow, tex_inf.value.shape[tex_inf.value.shape.length - 3], 0, format, gl.FLOAT, data); chk();
                    }
                }
            }
        }

        makeVertexIndexBuffer(pkg, param) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0); chk();
            gl.enable(gl.DEPTH_TEST); chk();

            var buf = gl.createBuffer(); chk();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf); chk();
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, param.VertexIndexBuffer, gl.STATIC_DRAW); chk();

            pkg.VertexIndexBufferInf = {
                value: param.VertexIndexBuffer,
                buffer: buf
            };
        }

        vecDim(tp) {
            if (tp == "vec4") {
                return 4;
            }
            else if (tp == "vec3") {
                return 3;
            }
            else if (tp == "vec2") {
                return 2;
            }
            else {
                return 1;
            }
        }

        initUniform(pkg) {
            pkg.uniforms.forEach(u => u.locUniform = gl.getUniformLocation(pkg.program, u.name), chk());
        }

        build(param) {
            var pkg = {};
            this.packages[param.id] = pkg;

            pkg.id = param.id;

            if (!param.fragmentShader) {
                // フラグメントシェーダが指定されてない場合

                // デフォルトのフラグメントシェーダをセットする。
                param.fragmentShader = this.minFragmentShader;
            }

            this.parseShader(pkg, param);

            var vertex_shader = this.makeShader(gl.VERTEX_SHADER, param.vertexShader);

            var fragment_shader = this.makeShader(gl.FRAGMENT_SHADER, param.fragmentShader);

            pkg.program = this.makeProgram(vertex_shader, fragment_shader, pkg.varyings);
            gl.useProgram(pkg.program); chk();

            // ユニフォーム変数の初期処理
            this.initUniform(pkg);

            // テクスチャの初期処理
            this.makeTexture(pkg);

            pkg.attribElementCount = param.elementCount;

            this.makeAttrib(pkg);

            if (pkg.varyings.length != 0) {
                //  varying変数がある場合

                for (let varying of pkg.varyings) {
                    var out_buffer_size = this.vecDim(varying.type) * pkg.attribElementCount * Float32Array.BYTES_PER_ELEMENT;

                    // Feedback empty buffer
                    varying.feedbackBuffer = gl.createBuffer(); chk();
                    gl.bindBuffer(gl.ARRAY_BUFFER, varying.feedbackBuffer); chk();
                    gl.bufferData(gl.ARRAY_BUFFER, out_buffer_size, gl.STATIC_COPY); chk();
                    gl.bindBuffer(gl.ARRAY_BUFFER, null); chk();
                }

                // -- Init TransformFeedback 
                pkg.transformFeedback = gl.createTransformFeedback(); chk();
            }

            if (param.VertexIndexBuffer) {
                this.makeVertexIndexBuffer(pkg, param);
            }

            return pkg;
        }

        setAttribData(pkg) {
            // -- Init Buffer
            for (var i = 0; i < pkg.attributes.length; i++) {
                var attrib = pkg.attributes[i];
                var dim = this.vecDim(attrib.type);

                gl.bindBuffer(gl.ARRAY_BUFFER, attrib.AttribBuffer); chk();
                gl.vertexAttribPointer(attrib.AttribLoc, dim, gl.FLOAT, false, 0, 0); chk();
                gl.bufferData(gl.ARRAY_BUFFER, attrib.value, gl.STATIC_DRAW);
            }
        }

        setUniformsData(pkg) {
            for (var i = 0; i < pkg.uniforms.length; i++) {
                var u = pkg.uniforms[i];
                if (u.value instanceof ArrayView || u.value instanceof Float32Array) {

                    var val = u.value instanceof ArrayView ? u.value.dt : u.value;

                    switch (u.type) {
                        case "mat4":
                            gl.uniformMatrix4fv(u.locUniform, false, val); chk();
                            break;
                        case "mat3":
                            gl.uniformMatrix3fv(u.locUniform, false, val); chk();
                            break;
                        case "vec4":
                            gl.uniform4fv(u.locUniform, val); chk();
                            break;
                        case "vec3":
                            gl.uniform3fv(u.locUniform, val); chk();
                            break;
                        case "vec2":
                            gl.uniform2fv(u.locUniform, val); chk();
                            break;
                        case "float":
                            gl.uniform1fv(u.locUniform, val); chk();
                            break;
                        default:
                            Assert(false);
                            break;
                    }
                }
                else {

                    if (u.type == "int" || u.type == "bool") {

                        gl.uniform1i(u.locUniform, u.value); chk();
                    }
                    else {

                        gl.uniform1f(u.locUniform, u.value); chk();
                    }
                }
            }
        }

        copyParamArgsValue(param, pkg){
            for(let args of[ pkg.attributes, pkg.uniforms, pkg.textures, pkg.varyings ]) {
                for (let arg of args) {
                    var val = param.args[arg.name];
                    Assert(val != undefined);
                    if (args == pkg.textures) {

                        arg.value = val.value;
                    }
                    else {

                        arg.value = val;
                    }
                }
            }
        }

        compute(param) {
            var pkg = this.packages[param.id];
            if (!pkg) {

                pkg = this.build(param);
            }
            else {

                gl.useProgram(pkg.program); chk();
            }

            this.copyParamArgsValue(param, pkg);

            this.setAttribData(pkg);

            gl.useProgram(pkg.program); chk();

            // テクスチャの値のセット
            this.setTextureData(pkg);

            // ユニフォーム変数のセット
            this.setUniformsData(pkg);

            if (pkg.varyings.length == 0) {
                //  描画する場合

                gl.viewport(0, 0, this.canvas.width, this.canvas.height); chk();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); chk();

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pkg.VertexIndexBufferInf.buffer); chk();
                gl.drawElements(gl.TRIANGLES, pkg.VertexIndexBufferInf.value.length, gl.UNSIGNED_SHORT, 0); chk();
            }
            else {
                //  描画しない場合

                gl.enable(gl.RASTERIZER_DISCARD); chk();

                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, pkg.transformFeedback); chk();

                for (var i = 0; i < pkg.varyings.length; i++) {
                    var varying = pkg.varyings[i];
                    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, varying.feedbackBuffer); chk();
                }

                // 計算開始
                gl.beginTransformFeedback(gl.POINTS); chk();    // TRIANGLES
                gl.drawArrays(gl.POINTS, 0, pkg.attribElementCount); chk();
                gl.endTransformFeedback(); chk();

                gl.disable(gl.RASTERIZER_DISCARD); chk();

                for (var i = 0; i < pkg.varyings.length; i++) {
                    varying = pkg.varyings[i];

                    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, null); chk();

                    // 処理結果を表示
                    gl.bindBuffer(gl.ARRAY_BUFFER, varying.feedbackBuffer); chk();

                    var out_buf = varying.value;
                    if (out_buf instanceof ArrayView) {
                        out_buf = out_buf.dt;
                    }

                    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, out_buf); chk();

                    gl.bindBuffer(gl.ARRAY_BUFFER, null); chk();
                }

                // 終了処理
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null); chk();
            }

            gl.useProgram(null); chk();
        }

        drawScene() {
            var param = this.drawObj.onDraw();

            var pMatrix = mat4.create();
            mat4.perspective(45, this.canvas.width / this.canvas.height, 0.1, 100.0, pMatrix);

            var mvMatrix = mat4.create();
            mat4.identity(mvMatrix);

            mat4.translate(mvMatrix, [0.0, 0.0, this.drawParam.z]);

            mat4.rotate(mvMatrix, this.drawParam.xRot, [1, 0, 0]);
            mat4.rotate(mvMatrix, this.drawParam.yRot, [0, 1, 0]);

            var pmvMatrix = mat4.create();
            mat4.multiply(pMatrix, mvMatrix, pmvMatrix);

            var normalMatrix = mat3.create();
            mat4.toInverseMat3(mvMatrix, normalMatrix);
            mat3.transpose(normalMatrix);

            param.args["uPMVMatrix"] = pmvMatrix;
            param.args["uNMatrix"] = normalMatrix;

            this.compute(param);

            window.requestAnimationFrame(this.drawScene.bind(this));
        }

        setStandardShader() {
            this.textureSphereVertexShader = `#version 300 es
                precision highp float;
                precision highp int;

                const vec3 uAmbientColor = vec3(0.2, 0.2, 0.2);
                const vec3 uLightingDirection =  normalize( vec3(0.25, 0.25, 1) );
                const vec3 uDirectionalColor = vec3(0.8, 0.8, 0.8);

                // 位置
                in vec3 VertexPosition;

                // 法線
                in vec3 VertexNormal;

                // テクスチャ座標
                in vec2 TextureCoord;

                uniform mat4 uPMVMatrix;
                uniform mat3 uNMatrix;

                out vec3 vLightWeighting;

	            out vec2 uv0;
	            out vec2 uv1;

                void main(void) {
                    gl_Position = uPMVMatrix * vec4(VertexPosition, 1.0);

                    vec3 transformedNormal = uNMatrix * VertexNormal;
                    float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
                    vLightWeighting = uAmbientColor +uDirectionalColor * directionalLightWeighting;

		            uv0 = fract( TextureCoord.st );
		            uv1 = fract( TextureCoord.st + vec2(0.5,0.5) ) - vec2(0.5,0.5);
                }
            `;

            this.minFragmentShader =
               `#version 300 es
                precision highp float;
                precision highp int;

                out vec4 color;

                void main(){
                    color = vec4(1.0);
                }`;


            this.defaultFragmentShader =
               `#version 300 es
                precision highp float;
                precision highp int;

                in vec3 vLightWeighting;
	            in vec2 uv0;
	            in vec2 uv1;

                uniform sampler2D TextureImage;

                out vec4 color;

                void main(void) {
                    vec2 uvT;

		            uvT.x = ( fwidth( uv0.x ) < fwidth( uv1.x )-0.001 ) ? uv0.x : uv1.x ;
		            uvT.y = ( fwidth( uv0.y ) < fwidth( uv1.y )-0.001 ) ? uv0.y : uv1.y ;

                    vec4 textureColor = texture(TextureImage, uvT);

                    color = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
                }
                `;
        }


        Draw3D(draw_obj) {
            this.drawObj = draw_obj;
            this.drawParam = {
                xRot : 0,
                yRot : 0,
                z    : -5.0
            }

            var lastMouseX = null;
            var lastMouseY = null;

            this.canvas.addEventListener('mousemove', function (event) {
                var newX = event.clientX;
                var newY = event.clientY;

                if (event.buttons != 0 && lastMouseX != null) {

                    this.drawParam.xRot += (newY -lastMouseY) / 300;
                    this.drawParam.yRot += (newX - lastMouseX) / 300;
                }

                lastMouseX = newX
                lastMouseY = newY;
            }.bind(this));

            this.canvas.addEventListener("wheel", function (e) {
                this.drawParam.z += 0.002 * e.wheelDelta;

                // ホイール操作によるスクロールを無効化する
                e.preventDefault();
            }.bind(this));

            this.drawScene();
        }
    }

    return new GPGPU(canvas);
}
