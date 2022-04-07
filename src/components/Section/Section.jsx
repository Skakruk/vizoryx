import { useContext, useState } from 'react';
import cls from './styles.module.css';
import stats from '../../statistics.json';
import { ImagePreviewContext } from '../ImagePreview/ImagePreview';
import LossBar from '../LossBar/LossBar';
import Ratio from '../Ratio/Ratio';
import ItemBlock from '../ItemBlock/ItemBlock';
import SectionCharts from '../SectionCharts/SectionCharts';

const defaultStats = {
  statuses: {
    total: 0,
    destroyed: 0,
    damaged: 0,
    abandoned: 0,
    captured: 0
  }
};

const sortByName = (a, b) => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();

  if (aName.includes('unknown') && !bName.includes('unknown')) return 1;
  if (bName.includes('unknown') && !aName.includes('unknown')) return -1;

  return a.name.localeCompare(b.name);
}

const formatNumber = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero"
});

const Section = ({ type }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { setImage } = useContext(ImagePreviewContext);
  const rus = stats.find(s => s.type.toLowerCase() === type && s.country === 'Russia') ?? defaultStats;
  const ukr = stats.find(s => s.type.toLowerCase() === type && s.country === 'Ukraine') ?? defaultStats;

  const handleLinkClick = ({ url }) => setImage(url);

  const rusDelta = (ukr.statuses.captured ?? 0) - rus.statuses.total;
  const ukrDelta = (rus.statuses.captured ?? 0) - ukr.statuses.total;

  return (
    <section className={cls.section}>
      <div className={cls.sectionTitle} onClick={() => setShowDetails(!showDetails)}>
        <div className={cls.leftSide}>
          <span className={cls.total}>{-rus.statuses.total}</span>
          {
            ukr.statuses.captured > 0 ? (
              <div className={cls.gainDelta}>
                <span className={cls.gain} title="Captured from opposite side">+{ukr.statuses.captured}</span>
                <span className={cls.delta}>&#916; {formatNumber.format(rusDelta)}</span>
              </div>
            ) : null
          }
        </div>
        <h3>
          {type}
          <span>{showDetails ? '▲' : '▼'}</span>
        </h3>
        <div className={cls.rightSide}>
          <span className={cls.total}>{-ukr.statuses.total}</span>
          {
            rus.statuses.captured > 0 ? (
              <div className={cls.gainDelta}>
                <span className={cls.gain} title="Captured from opposite side">+{rus.statuses.captured}</span>
                <span className={cls.delta}>&#916; {formatNumber.format(ukrDelta)}</span>
              </div>
            ) : null
          }
        </div>
      </div>
      {
        showDetails ? (
          <>
            <div className={cls.ratioWrapper}>
              <Ratio
                className={cls.ratio}
                left={Math.max(1, rus.statuses.total)}
                right={Math.max(1, ukr.statuses.total)}
              />
              {
                (rus.statuses.captured > 0 && ukr.statuses.captured > 0)
                && (rusDelta < 0 && ukrDelta < 0) ? (
                  <Ratio
                    className={cls.ratioDelta}
                    prefix="&#916;"
                    left={Math.abs(rusDelta)}
                    right={Math.abs(ukrDelta)}
                  />
                ) : null
              }
            </div>

            <SectionCharts type={type} />

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
      <LossBar left={rus.statuses.total} right={ukr.statuses.total} />
    </section>
  );
}

export default Section;
