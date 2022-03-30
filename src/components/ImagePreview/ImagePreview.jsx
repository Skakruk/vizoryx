import { createContext, useContext, useState } from 'react';
import cls from './styles.module.css';

export const ImagePreviewContext = createContext({
  setImage(){},
  image: '',
});

export const ImagePreviewProvider = ({ children }) => {
  const [image, setImage] = useState(null);
  return (
    <ImagePreviewContext.Provider value={{
      image,
      setImage,
    }}>
      {children}
    </ImagePreviewContext.Provider>
  );
}


const ImagePreview = () => {
  const { image, setImage } = useContext(ImagePreviewContext);
  if (!image) return null;

  return (
    <div className={cls.wrapper} onClick={() => setImage(null)}>
      <img className={cls.image} src={image} alt="" />
      <div className={cls.mask} />
    </div>
  );
}

export default ImagePreview;
