/*
 * OCCT 服务模块。
 * 负责加载 OpenCascade WASM 模块，并将参数化几何转换为 Three.js 可识别的三角形网格。
 */
import OpenCascade from 'opencascade.js/dist/opencascade.wasm.js';
import occtWasmUrl from 'opencascade.js/dist/opencascade.wasm.wasm?url';

// 缓存 OCCT 实例与初始化状态，避免重复加载。
let oc: any = null;
let initialized = false;
let initializing = false;
let initPromise: Promise<void> | null = null;

/**
 * 初始化 OpenCascade WASM 模块，仅执行一次。
 * locateFile 用于正确定位 runtime 所需的 .wasm 文件。
 * 
 * @returns 无返回值（异步函数）
 */
export async function initOCCT() {
  if (initialized) return;
  
  // 如果正在初始化，等待现有的初始化完成
  if (initializing && initPromise) {
    return initPromise;
  }
  
  initializing = true;
  initPromise = (async () => {
    try {
      console.log('开始加载 OpenCascade WASM...');
      const startTime = performance.now();
      
      oc = await new OpenCascade({
        locateFile(path: string) {
          if (path.endsWith('.wasm')) {
            return occtWasmUrl;
          }
          return path;
        }
      });
      
      const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`OpenCascade WASM 加载完成，耗时 ${loadTime}s`);
      
      ; (window as any).OCCT = oc;
      initialized = true;
      console.log('OCCT initialized');
    } catch (e) {
      console.error('无法加载 opencascade.js，请确保已安装或 CDN 可用', e);
      throw e;
    } finally {
      initializing = false;
    }
  })();
  
  return initPromise;
}

/**
 * 在后台预加载 OCCT 模块，不阻塞主线程。
 * 适用于应用启动时提前加载，提升首次交互体验。
 * 
 * @returns 无返回值（异步函数）
 */
export function preloadOCCT() {
  // 使用 requestIdleCallback 或 setTimeout 延迟加载，避免影响首屏渲染
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      initOCCT().catch(console.error);
    });
  } else {
    setTimeout(() => {
      initOCCT().catch(console.error);
    }, 1000);
  }
}

function toFloat32(arr: number[]) { return new Float32Array(arr); }

/**
 * 从当前形状参数生成 Three.js 可用的网格数据。
 * 返回扁平数组：positions、normals 和 indices。
 */
export async function generateMeshFromParams(params: { diameter: number, height: number, thickness: number, flange: number; }) {
  if (!initialized) await initOCCT();
  const o = oc;

  // 将用户输入参数转换为 OCCT 所需几何尺寸。
  const R = params.diameter / 2;
  const innerR = Math.max(1, R - params.thickness);
  const h = params.height;
  const flangeR = Math.max(R, params.flange);

  // 构建外壁圆柱体。
  const pnt = new o.gp_Pnt_3(0, 0, 0);
  const dir = new o.gp_Dir_3(new o.gp_XYZ_2(0, 0, 1));
  const ax2 = new o.gp_Ax2_3(pnt, dir);
  const outerCyl = new o.BRepPrimAPI_MakeCylinder_3(ax2, R, h).Shape();
  const innerCyl = new o.BRepPrimAPI_MakeCylinder_3(ax2, innerR, h).Shape();
  const shell = new o.BRepAlgoAPI_Cut_3(outerCyl, innerCyl).Shape();

  // 构建底部法兰为薄圆柱。
  const flangeHeight = params.thickness;
  const flangeCyl = new o.BRepPrimAPI_MakeCylinder_3(ax2, flangeR, flangeHeight).Shape();
  const movedFlange = flangeCyl;

  // 将管壳与法兰融合为一个整体形状。
  const fused = new o.BRepAlgoAPI_Fuse_3(shell, movedFlange).Shape();

  // 对融合后的形状生成三角网格。
  new o.BRepMesh_IncrementalMesh_2(fused, 0.5, true, 0.5, true);

  const verts: number[] = [];
  const norms: number[] = [];
  const indices: number[] = [];

  // 遍历融合形状的所有面，提取三角网格信息。
  const expFace = new o.TopExp_Explorer_2(
    fused,
    o.TopAbs_ShapeEnum.TopAbs_FACE,
    o.TopAbs_Orientation.TopAbs_REVERSED
  );
  let vid = 0;
  let faceCount = 0;
  let totalTriCount = 0;
  let totalNodeCount = 0;

  for (; expFace.More(); expFace.Next()) {
    faceCount++;
    const face = o.TopoDS.Face_1(expFace.Current());
    const loc = new o.TopLoc_Location_1();
    const triangHandle = o.BRep_Tool.Triangulation(face, loc);

      if (!triangHandle || triangHandle.IsNull()) {
      console.log('OCCT 面尚未生成三角化数据', faceCount);
      continue;
    }

    const triang = triangHandle.get();
    if (!triang || !triang.Nodes) {
      console.log('OCCT 面三角化对象缺失', faceCount);
      continue;
    }

    const nodes = triang.Nodes();
    const triangles = triang.Triangles();
    const n = nodes.Size();
    const tcount = triangles.Size();
    totalNodeCount += n;
    totalTriCount += tcount;
    console.log('OCCT 面三角化', faceCount, '节点数', n, '三角形数', tcount);

    // 将 OCCT 的 1-based 节点索引转换为三维位置数组。
    for (let i = 1; i <= n; i++) {
      const p = nodes.Value(i);
      verts.push(p.X(), p.Y(), p.Z());
    }

    // 将 OCCT 的三角形索引转换为 Three.js 的 0-based 索引。
    for (let i = 1; i <= tcount; i++) {
      const t = triangles.Value(i);
      const n1 = t.Value(1) - 1 + vid;
      const n2 = t.Value(2) - 1 + vid;
      const n3 = t.Value(3) - 1 + vid;
      indices.push(n1, n2, n3);
    }
    vid += n;
  }

  console.log('OCCT faces', faceCount, 'totalNodes', totalNodeCount, 'totalTriangles', totalTriCount);

  // 计算简单的面法线，用于渲染。
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const ax = verts[a], ay = verts[a + 1], az = verts[a + 2];
    const bx = verts[b], by = verts[b + 1], bz = verts[b + 2];
    const cx = verts[c], cy = verts[c + 1], cz = verts[c + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const nnx = nx / len, nny = ny / len, nnz = nz / len;
    for (let j = 0; j < 3; j++) {
      norms[indices[i + j] * 3 + 0] = nnx;
      norms[indices[i + j] * 3 + 1] = nny;
      norms[indices[i + j] * 3 + 2] = nnz;
    }
  }

  const result = { positions: verts, normals: norms.length ? norms : null, indices };
  console.log('OCCT mesh result', result.positions.length, result.indices.length, result.normals ? result.normals.length : 0);
  return result;
}
