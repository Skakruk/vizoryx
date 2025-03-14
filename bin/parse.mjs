import { parse } from 'node-html-parser';
import { promises as fs } from 'fs';
import got from 'got';
import imgCache from './cache/images.json' with { type: 'json' };

const machineryName = /^(?<total>\d+) (?<name>[A-z-0-9\/\s'"\(\).]+)/m;
const typeNameRegExp = /^(?!(Ukraine|Russia))(?<type>.+) \((\d+), of which (.+)\)/m;

const replaceTypeName = {
  'Engineering Vehicles': 'Engineering Vehicles and Equipment',
  'Radars': 'Radars And Communications Equipment',
  'Naval Ships': 'Naval Ships and Submarines',
};

const cleanText = text => text.trim().replace(/\u00a0/g, ' ');

(async () => {
  const pages = {
    'Ukraine': 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-ukrainian.html',
    'Russia': 'https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html',
  };

  const output = [];

  for await (const country of Object.keys(pages)) {
    const { body: html } = await got.get(pages[country]);
    const dom = parse(html);

    const mechanics = dom.querySelectorAll('h3')
      .filter(el => el && typeNameRegExp.test(cleanText(el.textContent)));

    for await (const el of mechanics) {
      let { type } = typeNameRegExp.exec(cleanText(el.textContent))?.groups;

      const statuses = ('total: ' + el.textContent)
        .replace(type, '')
        .replace('(', '')
        .replace(')', '')
        .replace('of which ', '')
        .trim()
        .split(',')
        .map(t => t.trim())
        .reduce((acc, t) => {
          const [statusType, count] = t.split(': ');
          acc[statusType] = Number(count?.trim());
          return acc;
        }, {});

      const listOfMechanics = el.querySelectorAll('+ ul li');

      const items = [];

      for await (const lEl of listOfMechanics) {
        const liText = lEl.textContent.trim().replace(/\u00a0/g, ' '); // nbsp
        const { total, name } = machineryName.exec(liText)?.groups ?? {};
        if (!name) continue;

        const links = lEl.querySelectorAll('a')
          .map(linkEl => ({
            url: linkEl.attrs.href,
            title: linkEl.textContent.replace('(', '').replace(')', ''),
          }));

        const linksToCorrect = links
          .map(link => {
            if (link.url.toLowerCase().startsWith('https://postimg.cc/')) {
              if (imgCache[link.url]) {
                return {
                  title: link.title,
                  url: imgCache[link.url]
                };
              }

              console.log('getting correct image link for', link.url);
              return new Promise(async (resolve) => {
                const { body } = await got.get(link.url);
                const postimgDom = parse(body);
                const url = postimgDom.querySelector('#code_direct').attrs.value;

                imgCache[link.url] = url;

                resolve({
                  title: link.title,
                  url,
                });
              });
            }

            return link;
          });

        const itemLinks = await Promise.all(linksToCorrect);

        items.push({
          total: Number(total),
          name: name.replace(':', ''),
          links: itemLinks,
        });
      }

      if (replaceTypeName[type]) {
        type = replaceTypeName[type];
      }

      if (output.find(o => o.type === type && o.country === country)) {
        output
          .forEach(o => {
            if (o.type === type && o.country === country) {
              o.statuses = {
                total: o.statuses.total + statuses.total,
                destroyed: o.statuses.destroyed + statuses.destroyed,
                captured: o.statuses.captured + statuses.captured,
                abandoned: o.statuses.abandoned + statuses.abandoned,
                damaged: o.statuses.damaged + statuses.damaged,
              }
              o.items = o.items.concat(items);
            }
          });
      } else {
        output.push({
          country,
          type,
          statuses,
          items,
        });
      }
    }
  }

  await fs.writeFile('./src/data/detailed.json', JSON.stringify(output, null, 2));
  await fs.writeFile('./bin/cache/images.json', JSON.stringify(imgCache));
})();

