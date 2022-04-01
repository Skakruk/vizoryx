import { useContext, useState } from 'react';
import classNames from 'classnames';
import cls from './styles.module.css';
import stats from '../../statistics.json';
import { ImagePreviewContext } from '../ImagePreview/ImagePreview';

const defaultStats = {
  statuses: {
    total: 0,
    destroyed: 0,
    damaged: 0,
    abandoned: 0,
    captured: 0
  }
};

const statuses = [
  'destroyed',
  'damaged',
  'abandoned',
  'captured'
]

const ItemBlock = ({ item, onLinkClick }) => {
  const [showItems, setShowItems] = useState(false);

  const createClickHandler = (link) => (e) => {
    if (link.link.startsWith('https://twitter.com')) {
      return true;
    }

    e.preventDefault();
    onLinkClick(link);
  }

  return (
    <li>
      <span className={classNames(cls.itemTitle, {
        [cls.active]: showItems,
      })} onClick={() => setShowItems(!showItems)}>
        <span className={cls.itemName}>{item.name}</span> {item.total}
      </span>
      {
        showItems ? (
          <ul className={cls.itemLinksWrapper}>
            {item.links.map(link => (
              <li key={link.status} title={link.status}>
                <a
                  onClick={createClickHandler(link)}
                  target="_blank"
                  rel="noopener"
                  href={link.link}
                >
                  {link.status}
                </a>
              </li>
            ))}
          </ul>
        ) : null
      }
    </li>
  )
}

const sortByName = (a, b) => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();

  if (aName.includes('unknown') && !bName.includes('unknown')) return 1;
  if (bName.includes('unknown') && !aName.includes('unknown')) return -1;

  return a.name.localeCompare(b.name);
}

const Section = ({ type }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { setImage } = useContext(ImagePreviewContext);
  const rus = stats.find(s => s.type.toLowerCase() === type && s.country === 'Russia') ?? defaultStats;
  const ukr = stats.find(s => s.type.toLowerCase() === type && s.country === 'Ukraine') ?? defaultStats;

  const handleLinkClick = ({ link }) => setImage(link);

  return (
    <section className={cls.section}>
      <div className={cls.sectionTitle} onClick={() => setShowDetails(!showDetails)}>
        <span className={cls.total}>{rus.statuses.total}</span>
        <h3>
          {type}
          <span>{showDetails ? '▲' : '▼'}</span>
        </h3>
        <span className={cls.total}>{ukr.statuses.total}</span>
      </div>
      {
        showDetails ? (
          <>
            <div className={cls.ratio}>
              {
                rus.statuses.total && ukr.statuses.total ? (
                  rus.statuses.total > ukr.statuses.total
                  ? `${Math.round(rus.statuses.total / ukr.statuses.total)} / 1`
                  : `1 / ${Math.round(ukr.statuses.total / rus.statuses.total)}`
                ) : null
              }
            </div>
            <div className={cls.categoriesWrapper}>
              <ul className={cls.categories}>
                {
                  statuses.map(status => (
                    <li key={status}>
                      <span className={cls.num}>{rus.statuses[status] ?? 0}</span>
                      <span className={cls.state}>{status}</span>
                      <span className={cls.num}>{ukr.statuses[status] ?? 0}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div className={cls.detailsWrapper}>
              <div className={cls.columns}>
                <div className={cls.column}>
                  <ul className={cls.itemsWrapper}>
                    {rus.items?.sort(sortByName)
                      .map(item => (<ItemBlock key={item.name} item={item} onLinkClick={handleLinkClick} />))}
                  </ul>
                </div>
                <div className={cls.column + ' ' + cls.columnLeft}>
                  <ul className={cls.itemsWrapper}>
                    {ukr.items?.sort(sortByName)
                      .map(item => (<ItemBlock key={item.name} item={item} onLinkClick={handleLinkClick} />))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : null
      }
    </section>
  );
}

export default Section;
