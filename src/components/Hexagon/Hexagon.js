import { animated } from "@react-spring/three";
import model from "static/hexagon.glb";
import { useGLTF } from "@react-three/drei";
const Hexagon = ({ scale, position }) => {
  const { nodes } = useGLTF(model);
  return (
    <animated.mesh
      scale={scale}
      position={position}
      rotation={[Math.PI / 2, Math.PI / 2, 0]}
      geometry={nodes["Circle002"].geometry}
    >
      <meshBasicMaterial color="#1677ff" />
    </animated.mesh>
  );
};

export default Hexagon;
