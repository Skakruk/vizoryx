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

const ItemBlock = ({ item, onLinkClick }) => {
  const [showItems, setShowItems] = useState(false);

  const createClickHandler = (link) => (e) => {
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
              <li key={link.status}>
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

const Section = ({ type }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { setImage } = useContext(ImagePreviewContext);
  const rus = stats.find(s => s.type.toLowerCase() === type && s.country === 'Russia') ?? defaultStats;
  const ukr = stats.find(s => s.type.toLowerCase() === type && s.country === 'Ukraine') ?? defaultStats;

  const handleLinkClick = ({ link }) => setImage(link);

  return (
    <section className={cls.section}>
      <div onClick={() => setShowDetails(!showDetails)}>
        <div className={cls.sectionTitle}>
          <span className={cls.total}>{rus.statuses.total}</span>
          <h3>
            {type}
            <span>{showDetails ? '▲' : '▼'}</span>
          </h3>
          <span className={cls.total}>{ukr.statuses.total}</span>
        </div>
        <div className={cls.columns}>
          <div className={cls.column}>
            <ul className={cls.categories}>
              <li><span>destroyed</span> {rus.statuses.destroyed ?? 0}</li>
              <li><span>damaged</span> {rus.statuses.damaged ?? 0}</li>
              <li><span>abandoned</span> {rus.statuses.abandoned ?? 0}</li>
              <li><span>captured</span> {rus.statuses.captured ?? 0}</li>
            </ul>
          </div>
          <div className={cls.column + ' ' + cls.columnLeft}>
            <ul className={cls.categories}>
              <li><span>destroyed</span> {ukr.statuses.destroyed ?? 0}</li>
              <li><span>damaged</span> {ukr.statuses.damaged ?? 0}</li>
              <li><span>abandoned</span> {ukr.statuses.abandoned ?? 0}</li>
              <li><span>captured</span> {ukr.statuses.captured ?? 0}</li>
            </ul>
          </div>
        </div>
      </div>
      {
        showDetails ? (
          <div className={cls.detailsWrapper}>
            <div className={cls.columns}>
              <div className={cls.column}>
                <ul className={cls.itemsWrapper}>
                  {rus.items?.map(item => (<ItemBlock key={item.name} item={item} onLinkClick={handleLinkClick} />))}
                </ul>
              </div>
              <div className={cls.column + ' ' + cls.columnLeft}>
                <ul className={cls.itemsWrapper}>
                  {ukr.items?.map(item => (<ItemBlock key={item.name} item={item} onLinkClick={handleLinkClick} />))}
                </ul>
              </div>
            </div>
          </div>
        ) : null
      }
    </section>
  );
}

export default Section;
