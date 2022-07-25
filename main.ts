import {
  Engine,
  Bodies,
  Render,
  Composite,
  Runner,
  Composites,
} from "matter-js";

const WIDTH = 800;
const HEIGHT = 600;

const engine = Engine.create();
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: WIDTH,
    height: HEIGHT,
    wireframes: false, // made color
  },
});

const boxA = Bodies.rectangle(400, 200, 80, 80);
const boxB = Bodies.rectangle(450, 50, 80, 80);
const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
const stack = Composites.stack(200, 200, 4, 4, 0, 0, (x: number, y: number) =>
  Bodies.circle(x, y, 50)
);
Composite.add(engine.world, [boxA, boxB, ground, stack]);

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);
