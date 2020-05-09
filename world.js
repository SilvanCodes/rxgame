import { list, capNumber } from './utils.js';

const GROUND = 0;
const PLAYER = 1;
const BOULDER = 2;

const generateWorld = (dimX, dimY) => list(dimY, () => list(dimX, i => Math.random() < 0.1 ? BOULDER : GROUND ));

const updateWorld = (world, { event, payload }) => {
    switch (event) {
        case 'MovePlayer':
            const { player, worldMap } = world;
            const [ deltaX, deltaY ] = payload;

            // reset player render
            worldMap[player.y][player.x] = 0;

            // cap with world boundaries
            player.x = capNumber(0, worldMap[0].length - 1, player.x + deltaX);
            player.y = capNumber(0, worldMap.length - 1, player.y + deltaY);

            // set player render
            worldMap[player.y][player.x] = 1;

            return { worldMap, player };
        default:
            return world;
    }
};

const renderWorld = ([[{worldMap}, length], { x, y }, ctx]) => {
    // clear canvas
    ctx.clearRect(0,0, window.innerWidth, window.innerHeight);

    // draw world
    worldMap.forEach((worldSlice, i) => {
        const yPos = y + length * i;
        // console.log('yPos:', yPos);
        worldSlice.forEach((field, j) => {
            const xPos = x + length * j;
            // console.log('xPos:', xPos);
            switch (field) {
                case GROUND:
                    ctx.fillStyle = 'green';
                    break;
                case PLAYER:
                    ctx.fillStyle = 'red';
                    break;
                case BOULDER:
                    ctx.fillStyle = 'brown';
                    break;
                default:
                    ctx.fillStyle = 'black';
            }
            ctx.fillRect(xPos, yPos, length, length);
        })
    });
};

export {
    generateWorld,
    updateWorld,
    renderWorld
};