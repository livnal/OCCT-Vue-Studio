<!--
 * Viewer3D.vue
 * 这个组件负责使用 Three.js 渲染 3D 模型。
 * 它初始化 WebGL 场景、相机、灯光，并在传入新参数时同步更新网格。
 -->
<script lang="ts">
import { defineComponent, onMounted, ref, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateMeshFromParams, initOCCT } from '../services/occt';

export default defineComponent({
  name: 'Viewer3D',
  props: { params: { type: Object, required: false } },
  setup(props) {
    const container = ref<HTMLDivElement | null>(null);

    // Three.js 场景对象在组件挂载后创建一次。
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let controls: any;
    let meshObj: THREE.Mesh | null = null;
    let edgeLines: THREE.LineSegments | null = null;
    let modelGroup: THREE.Group | null = null;

    async function init() {
      // 初始化 OCCT，确保三维网格生成之前模块已加载。
      await initOCCT();
      const el = container.value;
      if (!el) {
        console.warn('Viewer3D container is not mounted yet.');
        return;
      }

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f7f7);
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
      camera.position.set(220, 180, 220);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 50;
      controls.maxDistance = 800;
      controls.update();

      const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x444455, 0.65);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
      dirLight.position.set(180, 240, 180);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(2048, 2048);
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 1000;
      dirLight.shadow.camera.left = -250;
      dirLight.shadow.camera.right = 250;
      dirLight.shadow.camera.top = 250;
      dirLight.shadow.camera.bottom = -250;
      scene.add(dirLight);

      scene.add(new THREE.AmbientLight(0x747474, 0.35));

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.ShadowMaterial({ opacity: 0.25 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.01;
      ground.receiveShadow = true;
      scene.add(ground);

      const grid = new THREE.GridHelper(400, 40, 0xbbbbbb, 0xeaeaea);
      grid.position.y = -0.01;
      scene.add(grid);

      window.addEventListener('resize', onResize);
      animate();
    }

    function onResize() {
      if (!container.value) return;
      const w = container.value.clientWidth;
      const h = container.value.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    function createTextSprite(text: string) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Sprite();
      const fontSize = 48;
      ctx.font = `${fontSize}px Arial`;
      const padding = 16;
      const textWidth = ctx.measureText(text).width;
      canvas.width = Math.ceil(textWidth + padding * 2);
      canvas.height = Math.ceil(fontSize + padding * 1.5);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#222222';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, padding, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true })
      );
      const scale = 0.12;
      sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
      return sprite;
    }

    function buildDimensionHelpers(params: any) {
      const group = new THREE.Group();
      const outerR = params.diameter / 2;
      const height = params.height;
      const material = new THREE.LineBasicMaterial({ color: 0x333333 });
      const showDepth = outerR + 16;

      const heightLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-outerR - 32, 0, 0),
          new THREE.Vector3(-outerR - 32, 0, height)
        ]),
        material
      );
      group.add(heightLine);
      const heightArrowBottom = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-outerR - 36, 0, 0),
          new THREE.Vector3(-outerR - 28, 0, 0)
        ]),
        material
      );
      const heightArrowTop = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-outerR - 36, 0, height),
          new THREE.Vector3(-outerR - 28, 0, height)
        ]),
        material
      );
      group.add(heightArrowBottom, heightArrowTop);

      const heightText = createTextSprite(`高度 ${height} mm`);
      heightText.position.set(-outerR - 44, 0, height / 2);
      group.add(heightText);

      const diamY = -showDepth - 8;
      const diamZ = -height * 0.2;
      const diameterLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-outerR, diamY, diamZ),
          new THREE.Vector3(outerR, diamY, diamZ)
        ]),
        material
      );
      group.add(diameterLine);
      const diamArrowLeft = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-outerR, diamY, diamZ - 4),
          new THREE.Vector3(-outerR, diamY, diamZ + 4)
        ]),
        material
      );
      const diamArrowRight = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(outerR, diamY, diamZ - 4),
          new THREE.Vector3(outerR, diamY, diamZ + 4)
        ]),
        material
      );
      group.add(diamArrowLeft, diamArrowRight);

      const diameterText = createTextSprite(`外径 ${params.diameter} mm`);
      diameterText.position.set(0, diamY - 10, diamZ - 8);
      group.add(diameterText);

      const flangeText = createTextSprite(`法兰 ${params.flange} mm`);
      flangeText.position.set(0, height + 10, outerR + 12);
      group.add(flangeText);

      return group;
    }

    async function build(params: any) {
      if (!params) return;
      console.log('Viewer3D build params', params);
      try {
        const geom = await generateMeshFromParams(params);
        console.log('Viewer3D mesh', geom.positions.length, geom.indices.length);

        // 根据 OCCT 返回的网格数组构建 Three.js 几何体。
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(geom.positions, 3)
        );
        if (geom.normals && geom.normals.length > 0) {
          geometry.setAttribute(
            'normal',
            new THREE.Float32BufferAttribute(geom.normals, 3)
          );
        } else {
          geometry.computeVertexNormals();
        }
        geometry.setIndex(geom.indices);
        geometry.computeBoundingSphere();

        // 删除旧模型，避免重复显示。
        if (modelGroup) scene.remove(modelGroup);

        const mat = new THREE.MeshStandardMaterial({
          color: 0x7888c0,
          metalness: 0.08,
          roughness: 0.5,
          flatShading: false,
          side: THREE.DoubleSide,
          envMapIntensity: 0.8,
        });
        meshObj = new THREE.Mesh(geometry, mat);
        meshObj.castShadow = true;
        meshObj.receiveShadow = true;

        edgeLines = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 15),
          new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.35 })
        );

        const dims = buildDimensionHelpers(params);
        modelGroup = new THREE.Group();
        modelGroup.add(meshObj, edgeLines, dims);
        scene.add(modelGroup);

        // 将模型与标注一起居中，使相机和控制器默认聚焦在模型中心。
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        modelGroup.position.sub(center);
      } catch (e: any) {
        console.error('生成 3D 模型失败', e?.message ?? e, e);
      }
    }

    onMounted(async () => {
      await nextTick();
      init().catch(console.error);
    });

    watch(
      () => props.params,
      (p) => {
        if (p) build(p);
      }
    );

    return { container };
  }
});
</script>

<template>
  <div style="width: 100%; height: 100%; display: flex; flex-direction: column">
    <div style="flex: 1; min-height: 320px" ref="container"></div>
  </div>
</template>
