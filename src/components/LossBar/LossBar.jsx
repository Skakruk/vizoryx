import cls from './styles.module.css';
import classNames from 'classnames';

const LossBar = ({ left, right }) => {
  const total = left + right;
  return (
    <div className={cls.wrapper}>
      <div
        className={classNames(cls.indicator, {
          [cls.highlighted]: left > right
        })}
        style={{
          width: `${left / total * 100}%`,
        }}
      />
      <div
        className={classNames(cls.indicator, {
          [cls.highlighted]: left < right,
        })}
        style={{
          width: `${right / total * 100}%`,
        }}
      />
    </div>
  )
}

export default LossBar;
