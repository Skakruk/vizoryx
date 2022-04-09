const Ratio = ({ left, right, className, prefix}) => {
  if (!left || !right) return null;

  return (
    <div className={className}>
      {prefix ? `${prefix} ` : ''}
      {left > right
        ? `${Math.round((left / right) * 100) / 100} / 1`
        : `1 / ${Math.round((right / left) * 100) / 100}`
      }
    </div>
  )
}

export default Ratio;
