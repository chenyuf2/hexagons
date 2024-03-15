import "./App.scss";
import { useRef } from "react";
import Scene from "components/Scene/Scene";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
function App() {
  const sceneRef = useRef(null);
  return (
    <Canvas camera={{ position: [0, 0, 70], fov: 45 }}>
      <Scene ref={sceneRef} />
    </Canvas>
  );
}

export default App;
