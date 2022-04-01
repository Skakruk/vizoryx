const Ratio = ({ left, right, className, prefix}) => {
  if (!left || !right) return null;

  return (
    <div className={className}>
      {prefix ? `${prefix} ` : ''}
      {left > right
        ? `${Math.round(left / right)} / 1`
        : `1 / ${Math.round(right / left)}`
      }
    </div>
  )
}

export default Ratio;
