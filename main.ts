import {
  Bodies,
  Composite,
  Composites,
  Constraint,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  Vector,
} from "matter-js";
import { first, fromEventPattern, scan, switchMap } from "rxjs";

// ---- CONST ---- //

const UNIT = 20;
const WIDTH = 40 * UNIT;
const HEIGHT = 30 * UNIT;

// ---- UTIL ---- //

function unit(s: `${number}${"vw" | "vh" | "rem"}` | TemplateStringsArray) {
  const m = s.toString().match(/^(\d+\.?\d*)(vw|vh|rem)$/);
  if (!m) throw new Error(`s can not convert to vw vh`);
  const convert = { vw: WIDTH * 0.01, vh: HEIGHT * 0.01, rem: UNIT };
  return +m[1] * (convert[m[2]] ?? 1);
}

// ---- MATTER BRAIN ---- //

const engine = Engine.create({
  gravity: { x: 0, y: unit`0.2rem` },
});
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: WIDTH,
    height: HEIGHT,
    wireframes: false, // made color
  },
});
const runner = Runner.create();

Render.run(render);
Runner.run(runner, engine);

// ---- OBJECT + CONTRAIN ---- //

const ground = Bodies.rectangle(
  unit`80vw`,
  unit`60vh`,
  unit`8rem`,
  unit`1rem`,
  {
    isStatic: true,
  }
);

const stack = Composites.stack(
  unit`70vw`,
  unit`30vh`,
  4,
  4,
  unit`0rem`,
  unit`0rem`,
  (x: number, y: number) => {
    return Bodies.polygon(x, y, 8, unit`1rem`);
  }
);

const ball = Bodies.circle(unit`30vw`, unit`60vh`, unit`1.5rem`);
const sling = Constraint.create({
  pointA: Vector.clone(ball.position),
  bodyB: ball,
  stiffness: 0.05,
});

const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  // @ts-ignore
  constraint: {
    render: {
      visible: true,
    },
  },
});

Composite.add(engine.world, [ground, stack, sling, ball, mouseConstraint]);

// ---- EVENT ---- //

const mouseup$ = fromEventPattern((cb) =>
  Events.on(mouseConstraint, "mouseup", cb)
);
const afterupdate$ = fromEventPattern((cb) =>
  Events.on(engine, "afterUpdate", cb)
);

mouseup$
  .pipe(
    switchMap(() => afterupdate$.pipe(first())),
    scan((ball) => {
      // when mouse up -> create new ball
      return Bodies.circle(ball.position.x, ball.position.y, unit`1.5rem`);
    }, ball)
  )
  .subscribe(function firing(new_ball) {
    sling.bodyB = new_ball; // attach sling to new ball & release sling from old ball
    Composite.add(engine.world, [new_ball]);
  });
