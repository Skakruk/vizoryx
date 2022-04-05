import { parse } from 'node-html-parser';
import { promises as fs } from 'fs';
import got from 'got';

const machineryName = /^(?<total>\d+) (?<name>.+): (?=.+)/m;
const typeNameRegExp = /^(?!(Ukraine|Russia))(?<type>.+) \((\d+), of which (.+)\)/m;

const replaceTypeName = {
  'Engineering Vehicles': 'Engineering Vehicles and Equipment',
  'Radars': 'Radars And Communications Equipment'
};

const run = async () => {
  const { body: html } = await got.get('https://www.oryxspioenkop.com/2022/02/attack-on-europe-documenting-equipment.html');
  // const html = await fs.readFile('./tmp/index.html', 'utf8');

  const dom = parse(html);

  const ukraineEl = dom.querySelectorAll('h3 span[style*="color: red;"]')
    .find(el => el.textContent.startsWith('Ukraine'))
    .parentNode;

  const contentNode = ukraineEl.parentNode;
  const ukraineElIndex = contentNode.childNodes.findIndex(el => el === ukraineEl);

  const mechanics = dom.querySelectorAll('h3')
    .filter(el => el && typeNameRegExp.test(el.textContent));

  const output = [];

  for await (const el of mechanics) {
    let { type } = typeNameRegExp.exec(el.textContent)?.groups;

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

    const elIndex = Math.max(
      contentNode.childNodes.findIndex(chEl => chEl === el),
      contentNode.childNodes.findIndex(chEl => chEl === el.parentNode)
    );

    let country = 'Russia';
    if (ukraineElIndex < elIndex) {
      country = 'Ukraine';
    }

    const listOfMechanics = el.querySelectorAll('+ ul li');

    const items = [];

    for await (const lEl of listOfMechanics) {
      const liText = lEl.textContent.trim().replace(/\u00a0/g, ' '); // nbsp
      const { total, name } = machineryName.exec(liText).groups;

      const links = lEl.querySelectorAll('a')
        .map(linkEl => ({
          url: linkEl.attrs.href,
          title: linkEl.textContent.replace('(', '').replace(')', ''),
        }));

      const linksToCorrect = links
        .map(link => {
          if (link.url.toLowerCase().startsWith('https://postimg.cc/')) {
            console.log('getting correct image link for', link.url);
            return new Promise(async (resolve) => {
              const { body } = await got.get(link.url);
              const postimgDom = parse(body);
              resolve({
                title: link.title,
                url: postimgDom.querySelector('#code_direct').attrs.value
              });
            });
          }

          return link;
        });

      const itemLinks = await Promise.all(linksToCorrect);

      items.push({
        total: Number(total),
        name,
        links: itemLinks,
      });
    }

    if (replaceTypeName[type]) {
      type = replaceTypeName[type];
    }

    output.push({
      country,
      type,
      statuses,
      items,
    });
  }

  await fs.writeFile('./src/statistics.json', JSON.stringify(output, null, 2))
}

run();

