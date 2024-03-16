import Hexagon from "components/Hexagon/Hexagon";
import { useSpring } from "@react-spring/three";
import { useThree } from "@react-three/fiber";
import { useCallback, useRef } from "react";
import { Vector3 } from "three";
import { forwardRef, useEffect } from "react";
export const GAP = 0.2;
const NUM_ROW = 12;
const NUM_COL = 15;
const RADIUS = 8;
const Scene = forwardRef((_, ref) => {
  const isOver = useRef(false);
  const { width, height } = useThree((state) => state.size);
  const { width: canvasWidth, height: canvasHeight } = useThree((state) => state.viewport);
  const getDefaultHexgonPositions = () => {
    const pos = new Array(NUM_ROW * NUM_COL * 3).fill(0);
    let centroidX = 0;
    let centroidY = 0;
    for (let j = 0; j < NUM_COL; j++) {
      for (let i = 0; i < NUM_ROW; i++) {
        if (j % 2 === 0) {
          pos[3 * (i * NUM_COL + j)] = j * (1.5 + (Math.sqrt(3) * GAP) / 2);
          pos[3 * (i * NUM_COL + j) + 1] = Math.sqrt(3) * i + GAP * i;
        } else {
          pos[3 * (i * NUM_COL + j)] = j * (1.5 + (Math.sqrt(3) * GAP) / 2);
          pos[3 * (i * NUM_COL + j) + 1] = -Math.sqrt(3) / 2 - GAP / 2 + Math.sqrt(3) * i + GAP * i;
        }
        centroidX += pos[3 * (i * NUM_COL + j)];
        centroidY += pos[3 * (i * NUM_COL + j) + 1];
      }
    }
    centroidX /= NUM_COL * NUM_ROW;
    centroidY /= NUM_COL * NUM_ROW;
    for (let i = 0; i < NUM_ROW; i++) {
      for (let j = 0; j < NUM_COL; j++) {
        pos[3 * (i * NUM_COL + j)] -= centroidX;
        pos[3 * (i * NUM_COL + j) + 1] -= centroidY;
      }
    }
    return pos;
  };
  const defaultPositions = getDefaultHexgonPositions();
  const defaultScales = new Array(NUM_COL * NUM_ROW).fill(1);
  const [springs, api] = useSpring(
    () => ({
      scale: defaultScales,
      position: defaultPositions,
      config: (key) => {
        switch (key) {
          case "scale":
            return {
              mass: 1,
              friction: 20,
              tension: 320,
            };
          case "position":
            return { mass: 1, friction: 20, tension: 320 };
          default:
            return {};
        }
      },
    }),
    []
  );

  const getAnimatedScale = useCallback(
    (x, y) => {
      const scales = new Array(NUM_COL * NUM_ROW).fill(1);
      for (let i = 0; i < NUM_ROW; i++) {
        for (let j = 0; j < NUM_COL; j++) {
          const defaultPos = [
            defaultPositions[3 * (i * NUM_COL + j)],
            defaultPositions[3 * (i * NUM_COL + j) + 1],
            defaultPositions[3 * (i * NUM_COL + j) + 2],
          ];
          const distance = Math.sqrt(
            (defaultPos[0] - defaultPositions[3 * (x * NUM_COL + y)]) ** 2 +
              (defaultPos[1] - defaultPositions[3 * (x * NUM_COL + y) + 1]) ** 2
          );
          if (distance < RADIUS) {
            scales[i * NUM_COL + j] = 1 + 0.4 * Math.cos((distance * (Math.PI / 2)) / RADIUS) ** 12;
          }
        }
      }
      return scales;
    },
    [defaultPositions]
  );

  const getAnimatedPosition = useCallback(
    (x, y) => {
      const positions = new Array(NUM_ROW * NUM_COL * 3).fill(0);
      const queue = [[x, y, 0, 0]];
      const visit = new Set();
      visit.add([x, y].join("@"));
      while (queue.length !== 0) {
        const [i, j, shift, count] = queue.shift();
        const defaultPos = [
          defaultPositions[3 * (i * NUM_COL + j)],
          defaultPositions[3 * (i * NUM_COL + j) + 1],
          defaultPositions[3 * (i * NUM_COL + j) + 2],
        ];
        const distance = Math.sqrt(
          (defaultPos[0] - defaultPositions[3 * (x * NUM_COL + y)]) ** 2 +
            (defaultPos[1] - defaultPositions[3 * (x * NUM_COL + y) + 1]) ** 2
        );
        const vector = new Vector3(
          defaultPos[0] - defaultPositions[3 * (x * NUM_COL + y)],
          defaultPos[1] - defaultPositions[3 * (x * NUM_COL + y) + 1],
          0
        ).normalize();
        const scaleValue =
          distance < RADIUS ? 1 + 0.4 * Math.cos((distance * (Math.PI / 2)) / RADIUS) ** 12 : 1;

        const targetScale = shift + (scaleValue * Math.sqrt(3)) / 2 + count * GAP;
        const resultScale =
          count === 0
            ? 0
            : (targetScale * distance) / (Math.sqrt(3) * count + GAP * count) - distance;
        positions[3 * (i * NUM_COL + j)] = defaultPos[0] + vector.x * resultScale;
        positions[3 * (i * NUM_COL + j) + 1] = defaultPos[1] + vector.y * resultScale;
        const neighbors = [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ];
        if (j % 2 === 1) {
          neighbors.push([-1, -1], [-1, 1]);
        } else {
          neighbors.push([1, -1], [1, 1]);
        }
        for (let [a, b] of neighbors) {
          const newI = i + a;
          const newJ = j + b;
          if (newI < 0 || newI >= NUM_ROW || newJ < 0 || newJ >= NUM_COL) continue;
          const key = [newI, newJ].join("@");
          if (visit.has(key)) continue;
          visit.add(key);
          queue.push([
            newI,
            newJ,
            shift + (i === x && j === y ? Math.sqrt(3) / 2 : Math.sqrt(3)) * scaleValue,
            count + 1,
          ]);
        }
      }
      // console.log(visit);
      return positions;
    },
    [defaultPositions]
  );

  const handlePointerEnter = useCallback(
    (e) => {
      const x = (((e.offsetX / width) * 2 - 1) * canvasWidth) / 2;
      const y = (((e.offsetY / height) * -2 + 1) * canvasHeight) / 2;
      if (Math.abs(x) >= 15 || Math.abs(y) >= 15) {
        isOver.current = false;
        api.start({
          scale: defaultScales,
          position: defaultPositions,
        });
        return;
      }
      isOver.current = true;
      let maxDis = 10 ** 9;
      let resX = -1;
      let resY = -1;
      for (let i = 0; i < NUM_ROW; i++) {
        for (let j = 0; j < NUM_COL; j++) {
          const defaultPos = [
            defaultPositions[3 * (i * NUM_COL + j)],
            defaultPositions[3 * (i * NUM_COL + j) + 1],
            defaultPositions[3 * (i * NUM_COL + j) + 2],
          ];
          const dis = Math.sqrt((defaultPos[0] - x) ** 2 + (defaultPos[1] - y) ** 2);
          if (dis < maxDis) {
            maxDis = dis;
            resX = i;
            resY = j;
          }
        }
      }
      api.start({
        scale: getAnimatedScale(resX, resY),
        position: getAnimatedPosition(resX, resY),
      });
    },
    [
      api,
      canvasHeight,
      canvasWidth,
      defaultPositions,
      defaultScales,
      getAnimatedPosition,
      getAnimatedScale,
      height,
      width,
    ]
  );

  const handlePointerLeave = useCallback(() => {
    isOver.current = false;
    api.start({
      scale: defaultScales,
      position: defaultPositions,
    });
  }, [api, defaultPositions, defaultScales]);

  useEffect(() => {
    window.addEventListener("pointerover", handlePointerEnter);
    window.addEventListener("pointerout", handlePointerLeave);
    window.addEventListener("pointermove", handlePointerEnter);

    return () => {
      window.removeEventListener("pointerover", handlePointerEnter);
      window.removeEventListener("pointerout", handlePointerLeave);
      window.removeEventListener("pointermove", handlePointerEnter);
    };
  }, [handlePointerEnter, handlePointerLeave]);

  return (
    <group
    //   onPointerOver={handlePointerEnter}
    //   onPointerOut={handlePointerLeave}
    //   onPointerMove={handlePointerEnter}
    >
      {Array.from({ length: NUM_COL * NUM_ROW }).map((_, index) => {
        return (
          <Hexagon
            key={index}
            scale={springs.scale.to((...input) => input[index])}
            position={springs.position.to((...input) => [
              input[3 * index],
              input[3 * index + 1],
              input[3 * index + 2],
            ])}
          />
        );
      })}
    </group>
  );
});

export default Scene;
