import { useMemo } from 'react';
import classNames from 'classnames';
import Ratio from '../Ratio/Ratio';
import Section from '../Section/Section';
import stats from '../../data/detailed.json';
import statsByDayDB from '../../data/byDay.json';
import cls from './styles.module.css';
import { datesAreOnSameDay, getByStatus, getTotals } from '../../helpers';

const formatNumber = new Intl.NumberFormat('en-US', {
  signDisplay: 'exceptZero',
});

const ListView = ({ range }) => {
  const commonSections = stats.reduce((acc, entry, idx, self) => {
    if (idx < self.findIndex((se, i) => i > idx && se.type.toLowerCase() === entry.type.toLowerCase())) {
      acc.push(entry.type.toLowerCase());
    }
    return acc;
  }, []);

  const otherSections = stats.reduce((acc, entry) => {
    if (!commonSections.includes(entry.type.toLowerCase())) {
      acc.push(entry.type.toLowerCase());
    }
    return acc;
  }, []);

  const { Russia: rusStats, Ukraine: ukrStats } = useMemo(() => {
    if (range?.length > 0) {
      const startDayStats = statsByDayDB.find(db => datesAreOnSameDay(new Date(db.date), range[0]));
      const endDayStats = statsByDayDB.find(db => datesAreOnSameDay(new Date(db.date), range[1]));

      return {
        Russia: {
          total: getTotals(endDayStats.Russia) - getTotals(startDayStats.Russia),
          captured: getByStatus(endDayStats.Russia, 'captured') - getByStatus(startDayStats.Russia, 'captured'),
        },
        Ukraine: {
          total: getTotals(endDayStats.Ukraine) - getTotals(startDayStats.Ukraine),
          captured: getByStatus(endDayStats.Ukraine, 'captured') - getByStatus(startDayStats.Ukraine, 'captured'),
        },
      }
    } else {
      const lastDayStats = statsByDayDB[statsByDayDB.length - 1];
      return  {
        Russia: {
          total: getTotals(lastDayStats.Russia),
          captured: getByStatus(lastDayStats.Russia, 'captured'),
        },
        Ukraine: {
          total: getTotals(lastDayStats.Ukraine),
          captured: getByStatus(lastDayStats.Ukraine, 'captured'),
        },
      }
    }
  }, [range]);

  const rusDelta = (ukrStats.captured ?? 0) - rusStats.total;
  const ukrDelta = (rusStats.captured ?? 0) - ukrStats.total;

  return (
    <div className={cls.sections}>
      <section className={classNames(cls.section, cls.countryTotal)}>
        <div className={cls.columns}>
          <div className={cls.column}>
            <h2>Russia</h2>
            <span className={cls.total}>{formatNumber.format(-rusStats.total)}</span>
            {
              ukrStats.captured > 0 ? (
                <div className={cls.gainDelta}>
                  <span className={cls.gain} title="Captured from opposite side">+{ukrStats.captured}</span>
                  <span className={cls.delta}>&#916; {formatNumber.format(rusDelta)}</span>
                </div>
              ) : null
            }
          </div>
          <Ratio
            className={cls.ratio}
            left={rusStats.total}
            right={ukrStats.total}
          />
          <div className={classNames(cls.column, cls.columnRight)}>
            <h2>Ukraine</h2>
            <span className={cls.total}>{formatNumber.format(-ukrStats.total)}</span>
            {
              rusStats.captured > 0 ? (
                <div className={cls.gainDelta}>
                  <span className={cls.gain} title="Captured from opposite side">+{rusStats.captured}</span>
                  <span className={cls.delta}>&#916; {formatNumber.format(ukrDelta)}</span>
                </div>
              ) : null
            }
          </div>
        </div>
      </section>
      {
        commonSections.map(sectionType => (
          <Section key={sectionType} type={sectionType} range={range} />
        ))
      }
      {
        otherSections.map(sectionType => (
          <Section key={sectionType} type={sectionType} range={range} />
        ))
      }
    </div>
  )
}
export default ListView;
