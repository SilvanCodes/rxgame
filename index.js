import rxjs from 'https://dev.jspm.io/rxjs@6';
import operators from 'https://dev.jspm.io/rxjs@6/operators';

import { generateWorld, updateWorld, renderWorld } from './world.js';
import { getInputNumberStream, selectButtonFromKeyEventStream, renderAsText } from './utils.js';

const { fromEvent, BehaviorSubject, combineLatest, merge, NEVER } = rxjs;
const { tap, share, startWith, scan, switchMap, withLatestFrom, map, shareReplay } = operators;

// sources
const canvasContext$ = new BehaviorSubject(canvas.getContext('2d'));

const startX$ = getInputNumberStream(startX);

const startY$ = getInputNumberStream(startY);

const dimX$ = getInputNumberStream(dimX).pipe(
    tap(val => {
        startX.max = String(val - 1);
        if (Number(startX.value) > Number(startX.max)) {
            startX.value = startX.max;
            startX.dispatchEvent(new Event('input'));
        }
    })
);

const dimY$ = getInputNumberStream(dimY).pipe(
    tap(val => {
        startY.max = String(val - 1);
        if (Number(startY.value) > Number(startY.max)) {
            startY.value = startY.max;
            startY.dispatchEvent(new Event('input'));
        }
    })
);

const resize$ = fromEvent(window, 'resize').pipe(
    startWith(undefined),
    shareReplay(1)
);

const keydown$ = fromEvent(document, 'keydown').pipe(
    share()
);

const configurationOpen$ = fromEvent(configuration, 'toggle').pipe(
    map(({ target }) => target.open),
    startWith(configuration.open),
    shareReplay(1)
);

// intermediates
const controlKey$ = configurationOpen$.pipe(
    switchMap(open => open ? NEVER : keydown$)
);

const configurationKey$ = configurationOpen$.pipe(
    switchMap(open => open ? keydown$ : NEVER)
);

const moveUpKey$ = selectButtonFromKeyEventStream(moveUp, configurationKey$);
const moveDownKey$ = selectButtonFromKeyEventStream(moveDown, configurationKey$);
const moveLeftKey$ = selectButtonFromKeyEventStream(moveLeft, configurationKey$);
const moveRightKey$ = selectButtonFromKeyEventStream(moveRight, configurationKey$);

const dimension$ = combineLatest(
    dimX$,
    dimY$
).pipe(
    map(([x, y]) => ({ x, y })),
    shareReplay(1)
);

const playerStartPosition$ = combineLatest(
    startX$,
    startY$
).pipe(
    map(([x, y]) => ({ x, y })),
    shareReplay(1)
);

const canvasCenter$ = resize$.pipe(
    tap(_ => (canvas.width = window.innerWidth) && (canvas.height = window.innerHeight)),
    map(_ => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })),
);

const canvasFieldLength$ = combineLatest(
    resize$,
    dimension$
).pipe(
    map(([_, { x, y }]) => Math.floor(Math.min(window.innerWidth / x, window.innerHeight / y))),
    shareReplay(1)
);

const canvasWorldStart$ = canvasFieldLength$.pipe(
    withLatestFrom(dimension$, canvasCenter$),
    map(([length, { x: dimX, y: dimY }, { x, y }]) => ({
        x: Math.round(x - length * dimX / 2),
        y: Math.round(y - length * dimY / 2)
    }))
);

const initWorld$ = combineLatest(
    dimension$,
    playerStartPosition$
).pipe(
    map(([{ x: dimX, y: dimY }, { x, y }]) => {

        const worldMap = generateWorld(dimX, dimY);
        worldMap[y][x] = 1;
        return { worldMap, player: { x, y } };
    })
);

const playerPositionDelta$ = controlKey$.pipe(
    withLatestFrom(
        moveUpKey$,
        moveDownKey$,
        moveLeftKey$,
        moveRightKey$
    ),
    map(([{ key }, moveUp, moveDown, moveLeft, moveRight]) => {
        switch (key) {
            case moveUp:
                return { event: 'MovePlayer', payload: [0, -1]};
            case moveDown:
                return { event: 'MovePlayer', payload: [0, +1]};
            case moveLeft:
                return { event: 'MovePlayer', payload: [-1, 0]};
            case moveRight:
                return { event: 'MovePlayer', payload: [+1, 0]};
            default:
                return { event: 'MovePlayer', payload: [0, 0] };
        }
    }),
);

const updateWorld$ = initWorld$.pipe(
    switchMap(initialWorld => merge(
        playerPositionDelta$
    ).pipe(
        scan(updateWorld, initialWorld),
        startWith(initialWorld)
    )),
);

const render$ = combineLatest(
    updateWorld$,
    canvasFieldLength$
).pipe(
    withLatestFrom(
        canvasWorldStart$,
        canvasContext$
    ),
    tap(renderWorld)
);

const keyName$ = keydown$.pipe(
    map(({ key }) => key)
);

// sinks
renderAsText(keyName$, lastPressed);
render$.subscribe();
