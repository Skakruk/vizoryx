import path from 'path';
import { readFile, writeFile } from 'fs/promises';

// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
if (
  process.env.LD_LIBRARY_PATH == null ||
  !process.env.LD_LIBRARY_PATH.includes(
    `${process.env.PWD}/node_modules/canvas/build/Release:`,
  )
) {
  process.env.LD_LIBRARY_PATH = `${
    process.env.PWD
  }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ''}`;
}

console.log(process.env.LD_LIBRARY_PATH);

const excludeFromTotals = ['man-portable air defence systems', 'anti-tank guided missiles'];

const statuses = [
  'destroyed',
  'damaged',
  'abandoned',
  'captured'
];

const run = async () => {
  const { default: { createCanvas, registerFont } } = await import('canvas');

  const stats = JSON.parse(
    await readFile(
      new URL('../src/statistics.json', import.meta.url)
    )
  );

  const { Russia: rusStats, Ukraine: ukrStats } = stats.reduce((acc, entry) => {
    if (!acc[entry.country]) {
      acc[entry.country] = {
        total: 0,
        captured: 0,
        destroyed: 0,
        damaged: 0,
        abandoned: 0,
      };
    }
    if (!excludeFromTotals.includes(entry.type.toLowerCase())) {
      acc[entry.country].total += entry.statuses.total;
      acc[entry.country].captured += entry.statuses.captured ?? 0;
      acc[entry.country].destroyed += entry.statuses.destroyed ?? 0;
      acc[entry.country].damaged += entry.statuses.damaged ?? 0;
      acc[entry.country].abandoned += entry.statuses.abandoned ?? 0;
    }
    return acc;
  }, {});


  const width = 1200;
  const height = 630;

  registerFont(path.resolve('./bin/assets/BebasNeue-Regular.ttf'), {
    family: 'BebasNeue',
  });

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillStyle = '#1f1f1f';
  context.fillRect(0, 0, width, height);

  context.font = `regular 70pt 'BebasNeue'`;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillStyle = '#fff';

  context.fillText('Visual confirmed losses', 600, 40);

  context.font = `regular 55pt 'BebasNeue'`;
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText('Russia', 50, 180);

  context.textAlign = 'right';
  context.fillText('Ukraine', 1150, 180);

  const rusTextWidth = context.measureText('Russia').width;
  const ukrTextWidth = context.measureText('Ukraine').width;

  context.fillStyle = '#f00';
  context.font = `regular 40pt 'BebasNeue'`;
  context.textAlign = 'left';
  context.fillText(rusStats.total, rusTextWidth + 80, 192);

  statuses.map((status, idx) => {
    context.fillText(rusStats[status], 50, 300 + idx * 70);
  });

  context.textAlign = 'right';
  context.fillText(ukrStats.total, width - ukrTextWidth - 80, 192);

  statuses.map((status, idx) => {
    context.fillText(ukrStats[status], 1150, 300 + idx * 70);
  });

  context.fillStyle = '#fff';
  context.textAlign = 'center';

  statuses.map((status, idx) => {
    context.fillText(status, 600, 300 + idx * 70);
  });


  context.fillStyle = '#cbcbcb';
  context.fillRect(0, height - 15, width, height);

  context.fillStyle = '#ec0202';
  if (rusStats.total > ukrStats.total) {
    context.fillRect(0, height - 15, width * (rusStats.total / (rusStats.total + ukrStats.total)), height);
  } else {
    context.fillRect(width * (ukrStats.total / (rusStats.total + ukrStats.total)), height - 15, width, height);
  }

  const buffer = canvas.toBuffer('image/png');
  await writeFile('./dist/assets/card-image.png', buffer);
};


run();
