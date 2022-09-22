import { useState } from 'react';
import classNames from 'classnames';
import cls from './styles.module.css';

const ItemBlock = ({ item, onLinkClick }) => {
  const [showItems, setShowItems] = useState(false);

  const createClickHandler = (link) => (e) => {
    if (link.url.startsWith('https://twitter.com')) {
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
              <li key={`${link.url}-${link.title}`} title={link.status}>
                <a
                  onClick={createClickHandler(link)}
                  target="_blank"
                  rel="noopener"
                  href={link.url}
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null
      }
    </li>
  )
}

export default ItemBlock;
