import { ILaya } from "../../../../ILaya";
import { Physics } from "../../../d3/physics/Physics";
import { Resource } from "../../../resource/Resource";
import { Bounds } from "../../core/Bounds";
import { BufferState } from "../../core/BufferState";
import { IndexBuffer3D } from "../../graphics/IndexBuffer3D";
import { SubMeshInstanceBatch } from "../../graphics/SubMeshInstanceBatch";
import { VertexMesh } from "../../graphics/Vertex/VertexMesh";
import { VertexBuffer3D } from "../../graphics/VertexBuffer3D";
import { VertexElementFormat } from "../../graphics/VertexElementFormat";
import { MeshReader } from "../../loaders/MeshReader";
import { Color } from "../../math/Color";
import { Vector2 } from "../../math/Vector2";
import { Vector3 } from "../../math/Vector3";
import { Vector4 } from "../../math/Vector4";
import { Utils3D } from "../../utils/Utils3D";
import { SubMesh } from "./SubMesh";
/**
 * <code>Mesh</code> 类用于创建文件网格数据模板。
 */
export class Mesh extends Resource {
    /**
     * 创建一个 <code>Mesh</code> 实例,禁止使用。
     * @param isReadable 是否可读。
     */
    constructor(isReadable = true) {
        super();
        /** @internal */
        this._tempVector30 = new Vector3();
        /** @internal */
        this._tempVector31 = new Vector3();
        /** @internal */
        this._tempVector32 = new Vector3();
        /** @internal */
        this._minVerticesUpdate = Number.MAX_VALUE;
        /** @internal */
        this._maxVerticesUpdate = Number.MIN_VALUE;
        /** @internal */
        this._bufferState = new BufferState();
        /** @internal */
        this._instanceBufferState = new BufferState();
        /** */
        this._vertexBuffer = null;
        /** */
        this._indexBuffer = null;
        /** @internal */
        this._vertices = null;
        /** @internal */
        this._vertexCount = 0;
        this._isReadable = isReadable;
        this._subMeshes = [];
        this._skinDataPathMarks = [];
    }
    /**
    * @internal
    */
    static __init__() {
        var physics3D = Physics._physics3D;
        if (physics3D) {
            Mesh._nativeTempVector30 = new physics3D.btVector3(0, 0, 0);
            Mesh._nativeTempVector31 = new physics3D.btVector3(0, 0, 0);
            Mesh._nativeTempVector32 = new physics3D.btVector3(0, 0, 0);
        }
    }
    /**
     *@internal
     */
    static _parse(data, propertyParams = null, constructParams = null) {
        var mesh = new Mesh();
        MeshReader.read(data, mesh, mesh._subMeshes);
        return mesh;
    }
    /**
     * 加载网格模板。
     * @param url 模板地址。
     * @param complete 完成回掉。
     */
    static load(url, complete) {
        ILaya.loader.create(url, complete, null, Mesh.MESH);
    }
    /**
     * 获取网格的全局默认绑定动作逆矩阵。
     * @return  网格的全局默认绑定动作逆矩阵。
     */
    get inverseAbsoluteBindPoses() {
        return this._inverseBindPoses;
    }
    /**
     * 获取顶点个数。
     */
    get vertexCount() {
        return this._vertexCount;
    }
    /**
     * 获取SubMesh的个数。
     * @return SubMesh的个数。
     */
    get subMeshCount() {
        return this._subMeshes.length;
    }
    /**
     * 获取边界
     * @return 边界。
     */
    get bounds() {
        return this._bounds;
    }
    /**
     * @internal
     */
    _getPositionElement(vertexBuffer) {
        var vertexElements = vertexBuffer.vertexDeclaration._vertexElements;
        for (var i = 0, n = vertexElements.length; i < n; i++) {
            var vertexElement = vertexElements[i];
            if (vertexElement._elementFormat === VertexElementFormat.Vector3 && vertexElement._elementUsage === VertexMesh.MESH_POSITION0)
                return vertexElement;
        }
        return null;
    }
    /**
     * @internal
     */
    _generateBoundingObject() {
        var min = this._tempVector30;
        var max = this._tempVector31;
        min.x = min.y = min.z = Number.MAX_VALUE;
        max.x = max.y = max.z = -Number.MAX_VALUE;
        var vertexBuffer = this._vertexBuffer;
        var positionElement = this._getPositionElement(vertexBuffer);
        var verticesData = vertexBuffer.getFloat32Data();
        var floatCount = vertexBuffer.vertexDeclaration.vertexStride / 4;
        var posOffset = positionElement._offset / 4;
        for (var j = 0, m = verticesData.length; j < m; j += floatCount) {
            var ofset = j + posOffset;
            var pX = verticesData[ofset];
            var pY = verticesData[ofset + 1];
            var pZ = verticesData[ofset + 2];
            min.x = Math.min(min.x, pX);
            min.y = Math.min(min.y, pY);
            min.z = Math.min(min.z, pZ);
            max.x = Math.max(max.x, pX);
            max.y = Math.max(max.y, pY);
            max.z = Math.max(max.z, pZ);
        }
        this._bounds = new Bounds(min, max);
    }
    _getVerticeElementData(data, elementUsage) {
        data.length = 0;
        var verDec = this._vertexBuffer.vertexDeclaration;
        var element = verDec.getVertexElementByUsage(elementUsage);
        if (element) {
            var uint8Vertices = this._vertexBuffer.getUint8Data();
            var floatVertices = this._vertexBuffer.getFloat32Data();
            var verStr = verDec.vertexStride;
            var elementOffset = element._offset;
            switch (elementUsage) {
                case VertexMesh.MESH_TEXTURECOORDINATE0:
                case VertexMesh.MESH_TEXTURECOORDINATE1:
                    for (var i = 0; i < this._vertexCount; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec2 = new Vector2(floatVertices[offset], floatVertices[offset + 1]);
                        data.push(vec2);
                    }
                    break;
                case VertexMesh.MESH_POSITION0:
                case VertexMesh.MESH_NORMAL0:
                    for (var i = 0; i < this._vertexCount; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec3 = new Vector3(floatVertices[offset], floatVertices[offset + 1], floatVertices[offset + 2]);
                        data.push(vec3);
                    }
                    break;
                case VertexMesh.MESH_TANGENT0:
                case VertexMesh.MESH_BLENDWEIGHT0:
                    for (var i = 0; i < this._vertexCount; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec4 = new Vector4(floatVertices[offset], floatVertices[offset + 1], floatVertices[offset + 2], floatVertices[offset + 3]);
                        data.push(vec4);
                    }
                    break;
                case VertexMesh.MESH_COLOR0:
                    for (var i = 0; i < this._vertexCount; i++) {
                        var offset = verStr * i + elementOffset;
                        var cor = new Color(floatVertices[offset], floatVertices[offset + 1], floatVertices[offset + 2], floatVertices[offset + 3]);
                        data.push(cor);
                    }
                    break;
                case VertexMesh.MESH_BLENDINDICES0:
                    for (var i = 0; i < this._vertexCount; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec4 = new Vector4(uint8Vertices[offset], uint8Vertices[offset + 1], uint8Vertices[offset + 2], uint8Vertices[offset + 3]);
                        data.push(vec4);
                    }
                    break;
                default:
                    throw "Mesh:Unknown elementUsage.";
            }
        }
    }
    _setVerticeElementData(data, elementUsage) {
        var uint8Vertices = this._vertexBuffer.getUint8Data();
        var floatVertices = this._vertexBuffer.getFloat32Data();
        var verDec = this._vertexBuffer.vertexDeclaration;
        var verStr = verDec.vertexStride;
        var element = verDec.getVertexElementByUsage(elementUsage);
        if (element) {
            var elementOffset = element._offset;
            switch (elementUsage) {
                case VertexMesh.MESH_TEXTURECOORDINATE0:
                case VertexMesh.MESH_TEXTURECOORDINATE1:
                    for (var i = 0, n = data.length; i < n; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec2 = data[i];
                        floatVertices[offset] = vec2.x;
                        floatVertices[offset + 1] = vec2.y;
                    }
                    break;
                case VertexMesh.MESH_POSITION0:
                case VertexMesh.MESH_NORMAL0:
                    for (var i = 0, n = data.length; i < n; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec3 = data[i];
                        floatVertices[offset] = vec3.x;
                        floatVertices[offset + 1] = vec3.y;
                        floatVertices[offset + 2] = vec3.z;
                    }
                    break;
                case VertexMesh.MESH_TANGENT0:
                case VertexMesh.MESH_BLENDWEIGHT0:
                    for (var i = 0, n = data.length; i < n; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec4 = data[i];
                        floatVertices[offset] = vec4.x;
                        floatVertices[offset + 1] = vec4.y;
                        floatVertices[offset + 2] = vec4.z;
                        floatVertices[offset + 3] = vec4.w;
                    }
                    break;
                case VertexMesh.MESH_COLOR0:
                    for (var i = 0, n = data.length; i < n; i++) {
                        var offset = verStr * i + elementOffset;
                        var cor = data[i];
                        floatVertices[offset] = cor.r;
                        floatVertices[offset + 1] = cor.g;
                        floatVertices[offset + 2] = cor.b;
                        floatVertices[offset + 2] = cor.a;
                    }
                    break;
                case VertexMesh.MESH_BLENDINDICES0:
                    for (var i = 0, n = data.length; i < n; i++) {
                        var offset = verStr * i + elementOffset;
                        var vec4 = data[i];
                        uint8Vertices[offset] = vec4.x;
                        uint8Vertices[offset + 1] = vec4.y;
                        uint8Vertices[offset + 2] = vec4.z;
                        uint8Vertices[offset + 3] = vec4.w;
                    }
                    break;
                default:
                    throw "Mesh:Unknown elementUsage.";
            }
        }
        else {
            console.warn("Mesh: the mesh don't have  this VertexElement.");
            //TODO:vertexBuffer结构发生变化
        }
    }
    /**
     * @inheritDoc
     * @override
     */
    _disposeResource() {
        for (var i = 0, n = this._subMeshes.length; i < n; i++)
            this._subMeshes[i].destroy();
        this._nativeTriangleMesh && window.Physics3D.destroy(this._nativeTriangleMesh);
        this._vertexBuffer.destroy();
        this._indexBuffer.destroy();
        this._setCPUMemory(0);
        this._setGPUMemory(0);
        this._bufferState.destroy();
        this._instanceBufferState.destroy();
        this._bufferState = null;
        this._instanceBufferState = null;
        this._vertexBuffer = null;
        this._indexBuffer = null;
        this._subMeshes = null;
        this._nativeTriangleMesh = null;
        this._indexBuffer = null;
        this._boneNames = null;
        this._inverseBindPoses = null;
    }
    /**
     *@internal
     */
    _setSubMeshes(subMeshes) {
        this._subMeshes = subMeshes;
        for (var i = 0, n = subMeshes.length; i < n; i++)
            subMeshes[i]._indexInMesh = i;
        this._generateBoundingObject();
    }
    /**
     * @inheritDoc
     */
    _getSubMesh(index) {
        return this._subMeshes[index];
    }
    /**
     * @internal
     */
    _setBuffer(vertexBuffer, indexBuffer) {
        var bufferState = this._bufferState;
        bufferState.bind();
        bufferState.applyVertexBuffer(vertexBuffer);
        bufferState.applyIndexBuffer(indexBuffer);
        bufferState.unBind();
        var instanceBufferState = this._instanceBufferState;
        instanceBufferState.bind();
        instanceBufferState.applyVertexBuffer(vertexBuffer);
        instanceBufferState.applyInstanceVertexBuffer(SubMeshInstanceBatch.instance.instanceWorldMatrixBuffer);
        instanceBufferState.applyInstanceVertexBuffer(SubMeshInstanceBatch.instance.instanceMVPMatrixBuffer);
        instanceBufferState.applyIndexBuffer(indexBuffer);
        instanceBufferState.unBind();
    }
    /**
     * @internal
     */
    _getPhysicMesh() {
        if (!this._nativeTriangleMesh) {
            var physics3D = window.Physics3D;
            var triangleMesh = new physics3D.btTriangleMesh(); //TODO:独立抽象btTriangleMesh,增加内存复用
            var nativePositio0 = Mesh._nativeTempVector30;
            var nativePositio1 = Mesh._nativeTempVector31;
            var nativePositio2 = Mesh._nativeTempVector32;
            var position0 = this._tempVector30;
            var position1 = this._tempVector31;
            var position2 = this._tempVector32;
            var vertexBuffer = this._vertexBuffer;
            var positionElement = this._getPositionElement(vertexBuffer);
            var verticesData = vertexBuffer.getFloat32Data();
            var floatCount = vertexBuffer.vertexDeclaration.vertexStride / 4;
            var posOffset = positionElement._offset / 4;
            var indices = this._indexBuffer.getData(); //TODO:API修改问题
            for (var i = 0, n = indices.length; i < n; i += 3) {
                var p0Index = indices[i] * floatCount + posOffset;
                var p1Index = indices[i + 1] * floatCount + posOffset;
                var p2Index = indices[i + 2] * floatCount + posOffset;
                position0.setValue(verticesData[p0Index], verticesData[p0Index + 1], verticesData[p0Index + 2]);
                position1.setValue(verticesData[p1Index], verticesData[p1Index + 1], verticesData[p1Index + 2]);
                position2.setValue(verticesData[p2Index], verticesData[p2Index + 1], verticesData[p2Index + 2]);
                Utils3D._convertToBulletVec3(position0, nativePositio0, true);
                Utils3D._convertToBulletVec3(position1, nativePositio1, true);
                Utils3D._convertToBulletVec3(position2, nativePositio2, true);
                triangleMesh.addTriangle(nativePositio0, nativePositio1, nativePositio2, true);
            }
            this._nativeTriangleMesh = triangleMesh;
        }
        return this._nativeTriangleMesh;
    }
    /**
     * @internal
     */
    _uploadVerticesData() {
        var min = this._minVerticesUpdate;
        var max = this._maxVerticesUpdate;
        if (min !== Number.MAX_VALUE && this._maxVerticesUpdate !== Number.MIN_VALUE) {
            this._vertexBuffer.setData(this._vertexBuffer.getUint8Data().buffer, min * 4, min * 4, (max - min) * 4);
            this._minVerticesUpdate = Number.MAX_VALUE;
            this._maxVerticesUpdate = Number.MIN_VALUE;
        }
    }
    /**
     * 拷贝并填充位置数据至数组。
     * @param positions 位置数组。
     * @remark 该方法为拷贝操作，比较耗费性能。
     */
    getPositions(positions) {
        if (this._isReadable)
            this._getVerticeElementData(positions, VertexMesh.MESH_POSITION0);
        else
            throw "Mesh:can't get positions on mesh,isReadable must be true.";
    }
    /**
     * 设置位置数据。
     * @param positions 位置。
     */
    setPositions(positions) {
        if (this._isReadable)
            this._setVerticeElementData(positions, VertexMesh.MESH_POSITION0);
        else
            throw "Mesh:setPosition() need isReadable must be true or use setVertices().";
    }
    /**
     * 拷贝并填充颜色数据至数组。
     * @param colors 颜色数组。
     * @remark 该方法为拷贝操作，比较耗费性能。
     */
    getColors(colors) {
        if (this._isReadable)
            this._getVerticeElementData(colors, VertexMesh.MESH_COLOR0);
        else
            throw "Mesh:can't get colors on mesh,isReadable must be true.";
    }
    /**
     * 设置颜色数据。
     * @param colors  颜色。
     */
    setColors(colors) {
        if (this._isReadable)
            this._setVerticeElementData(colors, VertexMesh.MESH_COLOR0);
        else
            throw "Mesh:setColors() need isReadable must be true or use setVertices().";
    }
    /**
     * 拷贝并填充纹理坐标数据至数组。
     * @param uvs 纹理坐标数组。
     * @param channel 纹理坐标通道。
     * @remark 该方法为拷贝操作，比较耗费性能。
     */
    getUVs(uvs, channel = 0) {
        if (this._isReadable) {
            switch (channel) {
                case 0:
                    this._getVerticeElementData(uvs, VertexMesh.MESH_TEXTURECOORDINATE0);
                    break;
                case 1:
                    this._getVerticeElementData(uvs, VertexMesh.MESH_TEXTURECOORDINATE1);
                    break;
                default:
                    throw "Mesh:Invalid channel.";
            }
        }
        else {
            throw "Mesh:can't get uvs on mesh,isReadable must be true.";
        }
    }
    /**
     * 设置纹理坐标数据。
     * @param uvs 纹理坐标。
     * @param channel 纹理坐标通道。
     */
    setUVs(uvs, channel = 0) {
        if (this._isReadable) {
            switch (channel) {
                case 0:
                    this._setVerticeElementData(uvs, VertexMesh.MESH_TEXTURECOORDINATE0);
                    break;
                case 1:
                    this._setVerticeElementData(uvs, VertexMesh.MESH_TEXTURECOORDINATE1);
                    break;
                default:
                    throw "Mesh:Invalid channel.";
            }
        }
        else {
            throw "Mesh:setUVs() need isReadable must be true or use setVertices().";
        }
    }
    /**
     * 拷贝并填充法线数据至数组。
     * @param normals 法线数组。
     * @remark 该方法为拷贝操作，比较耗费性能。
     */
    getNormals(normals) {
        if (this._isReadable)
            this._getVerticeElementData(normals, VertexMesh.MESH_NORMAL0);
        else
            throw "Mesh:can't get colors on mesh,isReadable must be true.";
    }
    /**
     * 设置法线数据。
     * @param normals 法线。
     */
    setNormals(normals) {
        if (this._isReadable)
            this._setVerticeElementData(normals, VertexMesh.MESH_NORMAL0);
        else
            throw "Mesh:setNormals() need must be true or use setVertices().";
    }
    /**
     * 拷贝并填充切线数据至数组。
     * @param tangents 切线。
     */
    getTangents(tangents) {
        if (this._isReadable)
            this._getVerticeElementData(tangents, VertexMesh.MESH_TANGENT0);
        else
            throw "Mesh:can't get colors on mesh,isReadable must be true.";
    }
    /**
     * 设置切线数据。
     * @param tangents 切线。
     */
    setTangents(tangents) {
        if (this._isReadable)
            this._setVerticeElementData(tangents, VertexMesh.MESH_TANGENT0);
        else
            throw "Mesh:setTangents() need isReadable must be true or use setVertices().";
    }
    /**
    * 获取骨骼权重。
    * @param boneWeights 骨骼权重。
    */
    getBoneWeights(boneWeights) {
        if (this._isReadable)
            this._getVerticeElementData(boneWeights, VertexMesh.MESH_BLENDWEIGHT0);
        else
            throw "Mesh:can't get boneWeights on mesh,isReadable must be true.";
    }
    /**
    * 拷贝并填充骨骼权重数据至数组。
    * @param boneWeights 骨骼权重。
    */
    setBoneWeights(boneWeights) {
        if (this._isReadable)
            this._setVerticeElementData(boneWeights, VertexMesh.MESH_BLENDWEIGHT0);
        else
            throw "Mesh:setBoneWeights() need isReadable must be true or use setVertices().";
    }
    /**
    * 获取骨骼索引。
    * @param boneIndices 骨骼索引。
    */
    getBoneIndices(boneIndices) {
        if (this._isReadable)
            this._getVerticeElementData(boneIndices, VertexMesh.MESH_BLENDINDICES0);
        else
            throw "Mesh:can't get boneIndices on mesh,isReadable must be true.";
    }
    /**
    * 拷贝并填充骨骼索引数据至数组。
    * @param boneWeights 骨骼索引。
    */
    setBoneIndices(boneIndices) {
        if (this._isReadable)
            this._setVerticeElementData(boneIndices, VertexMesh.MESH_BLENDINDICES0);
        else
            throw "Mesh:setBoneIndices() need isReadable must be true or use setVertices().";
    }
    /**
     * 将Mesh标记为不可读,可减少内存，标记后不可再调用相关读取方法。
     */
    markAsUnreadbale() {
        this._uploadVerticesData();
        this._vertexBuffer.markAsUnreadbale();
        this._isReadable = false;
    }
    /**
     * 获取顶点声明。
     */
    getVertexDeclaration() {
        return this._vertexBuffer._vertexDeclaration;
    }
    /**
    * 拷贝并获取顶点数据的副本。
    * @return 顶点数据。
    */
    getVertices() {
        if (this._isReadable)
            return this._vertexBuffer.getUint8Data().buffer.slice(0);
        else
            throw "Mesh:can't get vertices on mesh,isReadable must be true.";
    }
    /**
    * 设置顶点数据。
    * @param boneWeights 骨骼权重。
    */
    setVertices(vertices) {
        return this._vertexBuffer.setData(vertices);
    }
    /**
     * 克隆。
     * @param	destObject 克隆源。
     */
    cloneTo(destObject) {
        var destMesh = destObject;
        var vb = this._vertexBuffer;
        var destVB = new VertexBuffer3D(vb._byteLength, vb.bufferUsage, vb.canRead);
        destVB.vertexDeclaration = vb.vertexDeclaration;
        destVB.setData(vb.getUint8Data().slice().buffer);
        destMesh._vertexBuffer = destVB;
        destMesh._vertexCount += destVB.vertexCount;
        var ib = this._indexBuffer;
        var destIB = new IndexBuffer3D(IndexBuffer3D.INDEXTYPE_USHORT, ib.indexCount, ib.bufferUsage, ib.canRead);
        destIB.setData(ib.getData().slice());
        destMesh._indexBuffer = destIB;
        destMesh._setBuffer(destMesh._vertexBuffer, destIB);
        destMesh._setCPUMemory(this.cpuMemory);
        destMesh._setGPUMemory(this.gpuMemory);
        var i;
        var boneNames = this._boneNames;
        var destBoneNames = destMesh._boneNames = [];
        for (i = 0; i < boneNames.length; i++)
            destBoneNames[i] = boneNames[i];
        var inverseBindPoses = this._inverseBindPoses;
        var destInverseBindPoses = destMesh._inverseBindPoses = [];
        for (i = 0; i < inverseBindPoses.length; i++)
            destInverseBindPoses[i] = inverseBindPoses[i];
        destMesh._bindPoseIndices = new Uint16Array(this._bindPoseIndices);
        for (i = 0; i < this._skinDataPathMarks.length; i++)
            destMesh._skinDataPathMarks[i] = this._skinDataPathMarks[i].slice();
        for (i = 0; i < this.subMeshCount; i++) {
            var subMesh = this._subMeshes[i];
            var subIndexBufferStart = subMesh._subIndexBufferStart;
            var subIndexBufferCount = subMesh._subIndexBufferCount;
            var boneIndicesList = subMesh._boneIndicesList;
            var destSubmesh = new SubMesh(destMesh);
            destSubmesh._subIndexBufferStart.length = subIndexBufferStart.length;
            destSubmesh._subIndexBufferCount.length = subIndexBufferCount.length;
            destSubmesh._boneIndicesList.length = boneIndicesList.length;
            for (var j = 0; j < subIndexBufferStart.length; j++)
                destSubmesh._subIndexBufferStart[j] = subIndexBufferStart[j];
            for (j = 0; j < subIndexBufferCount.length; j++)
                destSubmesh._subIndexBufferCount[j] = subIndexBufferCount[j];
            for (j = 0; j < boneIndicesList.length; j++)
                destSubmesh._boneIndicesList[j] = new Uint16Array(boneIndicesList[j]);
            destSubmesh._indexBuffer = destIB;
            destSubmesh._indexStart = subMesh._indexStart;
            destSubmesh._indexCount = subMesh._indexCount;
            destSubmesh._indices = new Uint16Array(destIB.getData().buffer, subMesh._indexStart * 2, subMesh._indexCount);
            var vertexBuffer = destMesh._vertexBuffer;
            destSubmesh._vertexBuffer = vertexBuffer;
            destMesh._subMeshes.push(destSubmesh);
        }
        destMesh._setSubMeshes(destMesh._subMeshes);
    }
    /**
     * 克隆。
     * @return	 克隆副本。
     */
    clone() {
        var dest = new Mesh();
        this.cloneTo(dest);
        return dest;
    }
}
/**Mesh资源。*/
Mesh.MESH = "MESH";