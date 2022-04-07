import got from 'got';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname, resolve } from 'path';
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { Low, JSONFile } from 'lowdb';

const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, 'recognized.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

const textractClient = new TextractClient({
  region: 'eu-west-1',
  credentials: fromIni({
    profile: 'textract',
  }),
});

const dateRegexps = [
  /(\d+)\/(\d+)\/(\d+)/,
  /(\d+)\.(\d+)\.(\d+)/
];

(async () => {
  await db.read();
  const stats = JSON.parse((await fs.readFile(resolve(__dirname, '../../src/statistics.json'))).toString('utf8'));
  const statImages = stats.reduce((acc, cat) => acc.concat(
    cat.items
      .reduce((itemsAcc, item) => itemsAcc.concat(item.links), [])
  ), []);

  for await (const link of statImages) {
    if (
      db.data.images.find((i) => i.link === link.url)
      || !link.url.toLowerCase().startsWith('https://i.postimg.cc')
    ) continue;

    console.log('Recognizing', link.url);

    const imageBuffer = await got.get(link.url).buffer();
    // let image = await sharp(imageBuffer);
    // image.greyscale();
    // await image.toFile(join(__dirname, `./images/${link.url.split('/').pop()}`));

    const params = {
      Document: {
        Bytes: imageBuffer,
      },
      FeatureTypes: ['TABLES'],
    };

    const analyzeDoc = new AnalyzeDocumentCommand(params);

    try {
      const response = await textractClient.send(analyzeDoc);
      const dates = [];

      response.Blocks
        .filter(block => block.BlockType === 'WORD')
        .forEach(block => {
          let parsedDate = null;

          dateRegexps.forEach((r) => {
            if (r.test(block.Text)) {
              const [, day, month, year] = r.exec(block.Text);
              const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
              if (!isNaN(date)) {
                date.setFullYear(2022);
                parsedDate = date;
              }
            }
          });

          if (parsedDate) {
            dates.push(parsedDate);
          }
        });

      console.log('Recognized', link.url, dates);

      db.data.images.push({
        link: link.url,
        dates,
      });
      await db.write();
    } catch (e) {
      console.error(e);
    }
  }

})();
