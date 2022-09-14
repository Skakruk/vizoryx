import { useContext, useMemo, useState } from 'react';
import c from './styles.module.css';
import cls from 'classnames';
import stats from '../../data/detailed.json';
import { ImagePreviewContext } from '../ImagePreview/ImagePreview';
import LossBar from '../LossBar/LossBar';
import Ratio from '../Ratio/Ratio';
import ItemBlock from '../ItemBlock/ItemBlock';
import SectionCharts from '../SectionCharts/SectionCharts';
import { datesAreOnSameDay, getByStatusAndType, getTotalsByType, sortByName } from '../../helpers';
import statsByDayDB from '../../data/byDay.json';

const formatNumber = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero"
});

const statuses = ['captured', 'destroyed', 'damaged', 'abandoned'];

const Section = ({ type, range }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { setImage } = useContext(ImagePreviewContext);
  const rusItems = stats.find(s => s.type.toLowerCase() === type && s.country === 'Russia');
  const ukrItems = stats.find(s => s.type.toLowerCase() === type && s.country === 'Ukraine');

  const { Russia: rusStats, Ukraine: ukrStats } = useMemo(() => {
    if (range?.length > 0) {
      const startDayStats = statsByDayDB.find(db => datesAreOnSameDay(new Date(db.date), range[0]));
      const endDayStats = statsByDayDB.find(db => datesAreOnSameDay(new Date(db.date), range[1]));

      return {
        Russia: {
          total: getTotalsByType(endDayStats.Russia, type) - getTotalsByType(startDayStats.Russia, type),
          ...(statuses.reduce((acc, status) => {
            acc[status] = getByStatusAndType(endDayStats.Russia, type, status) - getByStatusAndType(startDayStats.Russia, type, status);
            return acc;
          }, {})),
        },
        Ukraine: {
          total: getTotalsByType(endDayStats.Ukraine, type) - getTotalsByType(startDayStats.Ukraine, type),
          ...(statuses.reduce((acc, status) => {
            acc[status] = getByStatusAndType(endDayStats.Ukraine, type, status) - getByStatusAndType(startDayStats.Ukraine, type, status);
            return acc;
          }, {})),
        },
      }
    } else {
      const lastDayStats = statsByDayDB[statsByDayDB.length - 1];
      return {
        Russia: {
          total: getTotalsByType(lastDayStats.Russia, type),
          ...(statuses.reduce((acc, status) => {
            acc[status] = getByStatusAndType(lastDayStats.Russia, type, status);
            return acc;
          }, {})),
        },
        Ukraine: {
          total: getTotalsByType(lastDayStats.Ukraine, type),
          ...(statuses.reduce((acc, status) => {
            acc[status] = getByStatusAndType(lastDayStats.Ukraine, type, status);
            return acc;
          }, {})),
        },
      }
    }
  }, [range]);

  const handleLinkClick = ({ url }) => setImage(url);

  const rusDelta = (ukrStats.captured ?? 0) - rusStats.total;
  const ukrDelta = (rusStats.captured ?? 0) - ukrStats.total;

  return (
    <section className={c.section}>
      <div className={c.sectionTitle} onClick={() => setShowDetails(!showDetails)}>
        <div className={c.leftSide}>
          <span className={cls(c.total, { [c.wrong]: rusStats.total < 0 })}>{-rusStats.total}</span>
          {
            ukrStats.captured > 0 ? (
              <div className={c.gainDelta}>
                <span className={c.gain} title="Captured from opposite side">+{ukrStats.captured}</span>
                <span className={c.delta}>&#916; {formatNumber.format(rusDelta)}</span>
              </div>
            ) : null
          }
        </div>
        <h3>
          {type}
          <span>{showDetails ? '▲' : '▼'}</span>
        </h3>
        <div className={c.rightSide}>
          <span className={cls(c.total, { [c.wrong]: ukrStats.total < 0 })}>{-ukrStats.total}</span>
          {
            rusStats.captured > 0 ? (
              <div className={c.gainDelta}>
                <span className={c.gain} title="Captured from opposite side">+{rusStats.captured}</span>
                <span className={c.delta}>&#916; {formatNumber.format(ukrDelta)}</span>
              </div>
            ) : null
          }
        </div>
      </div>
      {
        showDetails ? (
          <>
            <div className={c.ratioWrapper}>
              <Ratio
                className={c.ratio}
                left={Math.max(1, rusStats.total)}
                right={Math.max(1, ukrStats.total)}
              />
              {
                (rusStats.captured > 0 && ukrStats.captured > 0)
                && (rusDelta < 0 && ukrDelta < 0) ? (
                  <Ratio
                    className={c.ratioDelta}
                    prefix="&#916;"
                    left={Math.abs(rusDelta)}
                    right={Math.abs(ukrDelta)}
                  />
                ) : null
              }
            </div>

            <SectionCharts type={type} range={range}/>

            {
              !range?.length ? (
                <div className={c.detailsWrapper}>
                  <div className={c.columns}>
                    <div className={c.column}>
                      <ul className={c.itemsWrapper}>
                        {rusItems.items?.sort(sortByName)
                          .map(item => (<ItemBlock key={item.name} item={item} onLinkClick={handleLinkClick} />))}
                      </ul>
                    </div>
                    <div className={c.column + ' ' + c.columnLeft}>
                      <ul className={c.itemsWrapper}>
                        {ukrItems.items?.sort(sortByName)
                          .map(item => (<ItemBlock key={item.name} item={item} onLinkClick={handleLinkClick} />))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null
            }
          </>
        ) : null
      }
      <LossBar left={rusStats.total} right={ukrStats.total} />
    </section>
  );
}

export default Section;
